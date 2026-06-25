package com.github.ryehlmarshmallow.oes.features.classroom.service;

import com.github.ryehlmarshmallow.oes.features.classroom.dto.*;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.*;
import com.github.ryehlmarshmallow.oes.features.classroom.group.service.ClassroomGroupService;
import com.github.ryehlmarshmallow.oes.features.classroom.group.repository.ClassroomGroupRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomInviteLinkRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomInviteRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.questionset.util.SortOrderUtil;
import com.github.ryehlmarshmallow.oes.common.exception.DomainBoundaryViolationException;
import com.github.ryehlmarshmallow.oes.features.notification.event.ClassroomInvitationEvent;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassroomService {

    private static final String TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final Duration USER_INVITE_EXPIRATION = Duration.ofDays(7);
    private static final Duration INVITE_LINK_MAX_EXPIRATION = Duration.ofDays(30);
    private static final int MAX_CLASSROOM_CAPACITY = 100;

    private final ClassroomRepository classroomRepository;
    private final ClassroomMemberRepository classroomMemberRepository;
    private final ClassroomInviteRepository classroomInviteRepository;
    private final ClassroomInviteLinkRepository classroomInviteLinkRepository;
    private final UserRepository userRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;
    private final ClassroomGroupRepository classroomGroupRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ClassroomResponse createClassroom(UUID ownerUserId, String name, String description) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Classroom name cannot be empty");
        }

        User owner = userRepository.findById(ownerUserId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + ownerUserId));

        Classroom classroom = Classroom.builder()
            .name(name.trim())
            .description(description)
            .createdBy(owner)
            .build();

        Classroom saved = classroomRepository.save(classroom);

        double orderIndex = allocateOrderIndex(ownerUserId);
        ClassroomMember ownerMember = ClassroomMember.builder()
            .classroom(saved)
            .user(owner)
            .role(ClassroomRole.OWNER)
            .canManageExams(true)
            .canManageStudents(true)
            .canManageGrades(true)
            .group(null)
            .orderIndex(orderIndex)
            .build();

        classroomMemberRepository.save(ownerMember);

        return toClassroomResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ClassroomMemberResponse> listMembers(UUID requesterUserId, UUID classroomId) {
        classroomAuthorizationService.requireActiveMember(classroomId, requesterUserId);

        return classroomMemberRepository.findByClassroomIdAndIsActiveTrueOrderByJoinedAtAsc(classroomId).stream()
            .map(this::toMemberResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UserLookupResponse> searchUsers(UUID requesterUserId, UUID classroomId, String query) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);
        if (!StringUtils.hasText(query)) {
            throw new IllegalArgumentException("Search query cannot be empty");
        }

        String trimmed = query.trim();
        return userRepository.findInviteCandidates(trimmed, classroomId)
            .stream()
            .map(user -> new UserLookupResponse(
                user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getMiddleName(),
                user.getLastName(),
                user.getEmail()
            ))
            .toList();
    }

    public ClassroomInviteResponse inviteUser(UUID requesterUserId, UUID classroomId, String identifier) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);

        Classroom classroom = findClassroom(classroomId);
        User inviter = findUser(requesterUserId);
        User target = resolveTargetUser(identifier);
        Instant now = Instant.now();

        if (classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(classroomId, target.getId()).isPresent()) {
            throw new IllegalArgumentException("User is already an active member of this classroom");
        }

        ClassroomInvite existingPending = classroomInviteRepository.findByClassroomIdAndTargetUserIdAndStatus(
            classroomId,
            target.getId(),
            ClassroomInviteStatus.PENDING
        ).orElse(null);

        if (existingPending != null && !isInviteExpired(existingPending, now)) {
            return toInviteResponse(existingPending, now);
        }

        long activeMembers = classroomMemberRepository.countByClassroomIdAndIsActiveTrue(classroomId);
        long pendingInvites = classroomInviteRepository.countByClassroomIdAndStatusAndExpiresAtAfter(
            classroomId,
            ClassroomInviteStatus.PENDING,
            now
        );

        if (activeMembers + pendingInvites >= MAX_CLASSROOM_CAPACITY) {
            throw new IllegalArgumentException("Classroom capacity limit reached (max " + MAX_CLASSROOM_CAPACITY + " members and pending invitations)");
        }

        ClassroomInvite invite = ClassroomInvite.builder()
            .classroom(classroom)
            .targetUser(target)
            .invitedBy(inviter)
            .status(ClassroomInviteStatus.PENDING)
            .expiresAt(now.plus(USER_INVITE_EXPIRATION))
            .build();

        ClassroomInvite saved = classroomInviteRepository.save(invite);

        String first = inviter.getFirstName() != null ? inviter.getFirstName() : "";
        String last = inviter.getLastName() != null ? inviter.getLastName() : "";
        String inviterName = (first + " " + last).trim();
        if (!StringUtils.hasText(inviterName)) {
            inviterName = inviter.getUsername();
        }

        eventPublisher.publishEvent(new ClassroomInvitationEvent(
            this,
            saved.getId(),
            classroom.getId(),
            target.getId(),
            inviterName,
            classroom.getName()
        ));

        return toInviteResponse(saved, now);
    }

    public ClassroomInviteResponse acceptInvite(UUID requesterUserId, UUID inviteId) {
        ClassroomInvite invite = classroomInviteRepository.findDetailedById(inviteId)
            .orElseThrow(() -> new IllegalArgumentException("Invite not found: " + inviteId));
        Instant now = Instant.now();

        if (!invite.getTargetUser().getId().equals(requesterUserId)) {
            throw new IllegalArgumentException("You can only accept invites addressed to your account");
        }

        ClassroomInviteStatus effectiveStatus = getEffectiveInviteStatus(invite, now);
        if (effectiveStatus == ClassroomInviteStatus.EXPIRED) {
            throw new IllegalArgumentException("Invite has expired");
        }
        if (effectiveStatus != ClassroomInviteStatus.PENDING) {
            throw new IllegalArgumentException("Invite is not pending");
        }

        upsertStudentMembership(invite.getClassroom(), invite.getTargetUser());
        invite.setStatus(ClassroomInviteStatus.ACCEPTED);
        invite.setRespondedAt(now);

        return toInviteResponse(classroomInviteRepository.save(invite), now);
    }

    public ClassroomInviteResponse revokeInvite(UUID requesterUserId, UUID classroomId, UUID inviteId) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);

        ClassroomInvite invite = classroomInviteRepository.findDetailedById(inviteId)
            .orElseThrow(() -> new IllegalArgumentException("Invite not found: " + inviteId));

        if (!invite.getClassroom().getId().equals(classroomId)) {
            throw new IllegalArgumentException("Invite does not belong to this classroom");
        }

        if (invite.getStatus() == ClassroomInviteStatus.PENDING) {
            invite.setStatus(ClassroomInviteStatus.REVOKED);
            invite.setRespondedAt(Instant.now());
        }

        return toInviteResponse(classroomInviteRepository.save(invite));
    }

    @Transactional(readOnly = true)
    public List<ClassroomInviteResponse> listMyInvites(UUID requesterUserId) {
        Instant now = Instant.now();
        return classroomInviteRepository.findByTargetUserIdOrderByCreatedAtDesc(requesterUserId).stream()
            .map(invite -> toInviteResponse(invite, now))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassroomInviteResponse> listClassroomInvites(UUID requesterUserId, UUID classroomId) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);
        Instant now = Instant.now();
        return classroomInviteRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
            .map(invite -> toInviteResponse(invite, now))
            .toList();
    }

    @Transactional
    public void deleteClassroomInviteHistory(UUID requesterUserId, UUID classroomId) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);
        classroomInviteRepository.deleteByClassroomIdAndStatusNot(classroomId, ClassroomInviteStatus.PENDING);
    }

    @Transactional
    public void deleteInactiveInviteLinks(UUID requesterUserId, UUID classroomId) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);
        List<ClassroomInviteLink> links = classroomInviteLinkRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId);
        List<ClassroomInviteLink> inactiveLinks = links.stream()
            .filter(link -> isRevoked(link) || isExpired(link) || isCapacityReached(link))
            .toList();
        classroomInviteLinkRepository.deleteAll(inactiveLinks);
    }

    @Transactional(readOnly = true)
    public ClassroomInviteResponse getInvite(UUID requesterUserId, UUID inviteId) {
        ClassroomInvite invite = classroomInviteRepository.findDetailedById(inviteId)
            .orElseThrow(() -> new IllegalArgumentException("Invite not found: " + inviteId));

        if (!invite.getTargetUser().getId().equals(requesterUserId)) {
            throw new IllegalArgumentException("You can only view invites addressed to your account");
        }

        return toInviteResponse(invite, Instant.now());
    }

    public ClassroomInviteResponse rejectInvite(UUID requesterUserId, UUID inviteId) {
        ClassroomInvite invite = classroomInviteRepository.findDetailedById(inviteId)
            .orElseThrow(() -> new IllegalArgumentException("Invite not found: " + inviteId));

        if (!invite.getTargetUser().getId().equals(requesterUserId)) {
            throw new IllegalArgumentException("You can only decline invites addressed to your account");
        }

        ClassroomInviteStatus effectiveStatus = getEffectiveInviteStatus(invite, Instant.now());
        if (effectiveStatus != ClassroomInviteStatus.PENDING) {
            throw new IllegalArgumentException("Invite is not pending");
        }

        invite.setStatus(ClassroomInviteStatus.REJECTED);
        invite.setRespondedAt(Instant.now());
        return toInviteResponse(classroomInviteRepository.save(invite), Instant.now());
    }

    @Transactional(readOnly = true)
    public List<MyClassroomResponse> listMyClassrooms(UUID requesterUserId) {
        return classroomMemberRepository.findByUserIdAndIsActiveTrueOrderByOrderIndexAsc(requesterUserId).stream()
            .map(member -> new MyClassroomResponse(
                member.getClassroom().getId(),
                member.getClassroom().getName(),
                member.getClassroom().getDescription(),
                member.getRole(),
                member.isCanManageExams(),
                member.isCanManageStudents(),
                member.isCanManageGrades(),
                member.getGroup() != null ? member.getGroup().getId() : null,
                member.getOrderIndex(),
                member.getJoinedAt(),
                member.getClassroom().getCreatedAt()
            ))
            .toList();
    }

    public ClassroomInviteLinkResponse createInviteLink(UUID requesterUserId, UUID classroomId, Instant expiresAt, Integer maxUses) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);

        Instant now = Instant.now();
        if (expiresAt != null && !expiresAt.isAfter(now)) {
            throw new IllegalArgumentException("Invite link expiration must be in the future");
        }
        if (expiresAt != null && expiresAt.isAfter(now.plus(INVITE_LINK_MAX_EXPIRATION))) {
            throw new IllegalArgumentException("Invite link expiration cannot be more than 30 days from now");
        }
        if (maxUses != null && maxUses <= 0) {
            throw new IllegalArgumentException("Invite link maxUses must be greater than zero");
        }

        Classroom classroom = findClassroom(classroomId);
        User creator = findUser(requesterUserId);

        ClassroomInviteLink link = ClassroomInviteLink.builder()
            .classroom(classroom)
            .createdBy(creator)
            .token(generateUniqueToken())
            .expiresAt(expiresAt)
            .maxUses(maxUses)
            .build();

        return toInviteLinkResponse(classroomInviteLinkRepository.save(link));
    }

    public ClassroomInviteLinkResponse revokeInviteLink(UUID requesterUserId, UUID classroomId, UUID linkId) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);

        ClassroomInviteLink link = classroomInviteLinkRepository.findDetailedById(linkId)
            .orElseThrow(() -> new IllegalArgumentException("Invite link not found: " + linkId));

        if (!link.getClassroom().getId().equals(classroomId)) {
            throw new IllegalArgumentException("Invite link does not belong to this classroom");
        }

        if (link.getRevokedAt() == null) {
            link.setRevokedAt(Instant.now());
            link.setRevokedBy(findUser(requesterUserId));
        }

        return toInviteLinkResponse(classroomInviteLinkRepository.save(link));
    }

    @Transactional(readOnly = true)
    public List<ClassroomInviteLinkResponse> listInviteLinks(UUID requesterUserId, UUID classroomId) {
        classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);

        return classroomInviteLinkRepository.findByClassroomIdOrderByCreatedAtDesc(classroomId).stream()
            .map(this::toInviteLinkResponse)
            .toList();
    }

    public ClassroomResponse acceptInviteLink(UUID requesterUserId, String token) {
        ClassroomInviteLink link = classroomInviteLinkRepository.findDetailedByTokenForUpdate(token)
            .orElseThrow(() -> new IllegalArgumentException("Invite link not found"));

        if (isRevoked(link)) {
            throw new IllegalArgumentException("Invite link has been revoked");
        }
        if (isExpired(link)) {
            throw new IllegalArgumentException("Invite link has expired");
        }
        if (isCapacityReached(link)) {
            throw new IllegalArgumentException("Invite link usage limit has been reached");
        }

        User user = findUser(requesterUserId);
        boolean membershipCreated = upsertStudentMembership(link.getClassroom(), user);

        if (membershipCreated) {
            link.setUseCount(link.getUseCount() + 1);
            classroomInviteLinkRepository.save(link);
        }

        return toClassroomResponse(link.getClassroom());
    }

    @Transactional(readOnly = true)
    public ClassroomInviteLinkDetailsResponse getInviteLinkDetails(UUID requesterUserId, String token) {
        ClassroomInviteLink link = classroomInviteLinkRepository.findDetailedByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invite link not found"));

        boolean isAlreadyMember = classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(
            link.getClassroom().getId(),
            requesterUserId
        ).isPresent();

        User inviter = link.getCreatedBy();
        return new ClassroomInviteLinkDetailsResponse(
            link.getToken(),
            link.getClassroom().getId(),
            link.getClassroom().getName(),
            link.getClassroom().getDescription(),
            inviter.getUsername(),
            inviter.getFirstName(),
            inviter.getLastName(),
            isExpired(link),
            isRevoked(link),
            isCapacityReached(link),
            isAlreadyMember
        );
    }

    public ClassroomMemberResponse updateMemberPermissions(
        UUID requesterUserId,
        UUID classroomId,
        UUID memberId,
        boolean canManageExams,
        boolean canManageStudents,
        boolean canManageGrades,
        ClassroomRole role
    ) {
        classroomAuthorizationService.requireOwner(classroomId, requesterUserId);

        ClassroomMember member = classroomMemberRepository.findById(memberId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        if (!member.getClassroom().getId().equals(classroomId)) {
            throw new IllegalArgumentException("Member does not belong to this classroom");
        }
        if (!member.isActive()) {
            throw new IllegalArgumentException("Cannot update permissions for inactive member");
        }
        if (member.getRole() == ClassroomRole.OWNER) {
            throw new IllegalArgumentException("Owner permissions are fixed");
        }
        if (role == ClassroomRole.OWNER) {
            throw new IllegalArgumentException("Cannot change member role to Owner");
        }

        member.setCanManageExams(canManageExams);
        member.setCanManageStudents(canManageStudents);
        member.setCanManageGrades(canManageGrades);
        member.setRole(role);

        if (role == ClassroomRole.STUDENT) {
            member.setCanManageExams(false);
            member.setCanManageStudents(false);
            member.setCanManageGrades(false);
        }

        return toMemberResponse(classroomMemberRepository.save(member));
    }

    public void kickMember(UUID requesterUserId, UUID classroomId, UUID memberId) {
        ClassroomMember actor = classroomAuthorizationService.requireManageStudents(classroomId, requesterUserId);

        ClassroomMember target = classroomMemberRepository.findById(memberId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found: " + memberId));

        if (!target.getClassroom().getId().equals(classroomId)) {
            throw new IllegalArgumentException("Member does not belong to this classroom");
        }
        if (!target.isActive()) {
            return;
        }
        if (target.getRole() == ClassroomRole.OWNER) {
            throw new IllegalArgumentException("Owner cannot be removed from classroom");
        }
        if (target.getUser().getId().equals(requesterUserId)) {
            throw new IllegalArgumentException("You cannot remove yourself");
        }
        if (actor.getRole() != ClassroomRole.OWNER && target.getRole() == ClassroomRole.STAFF) {
            throw new IllegalArgumentException("Only owner can remove staff members");
        }

        target.setActive(false);
        target.setLeftAt(Instant.now());
        target.setRemovedBy(findUser(requesterUserId));
        classroomMemberRepository.save(target);
    }

    public List<ClassroomResponse> moveClassroomsToGroup(UUID requesterUserId, List<UUID> classroomIds, UUID groupId) {
        if (classroomIds == null || classroomIds.isEmpty()) {
            throw new IllegalArgumentException("classroomIds cannot be empty");
        }

        var destinationGroup = groupId == null
            ? null
            : classroomGroupRepository.findByIdAndOwnerUserId(groupId, requesterUserId)
            .orElseThrow(() -> new IllegalArgumentException("Classroom group not found: " + groupId));

        if (destinationGroup != null
            && ClassroomGroupService.RESERVED_GROUP_NAME.equalsIgnoreCase(destinationGroup.getName())) {
            throw new IllegalArgumentException("Reserved group must be represented as null groupId");
        }

        Set<UUID> uniqueIds = new LinkedHashSet<>(classroomIds);
        List<UUID> orderedUniqueIds = uniqueIds.stream().toList();
        List<ClassroomMember> memberships = classroomMemberRepository.findByUserIdAndClassroomIdInAndIsActiveTrue(
            requesterUserId,
            orderedUniqueIds
        );
        if (memberships.size() != orderedUniqueIds.size()) {
            throw new IllegalArgumentException("Some classrooms are not active for the requesting user");
        }

        Map<UUID, ClassroomMember> membershipByClassroomId = memberships.stream()
            .collect(Collectors.toMap(m -> m.getClassroom().getId(), Function.identity()));

        List<ClassroomMember> toUpdate = new ArrayList<>();
        for (UUID classroomId : orderedUniqueIds) {
            ClassroomMember membership = membershipByClassroomId.get(classroomId);
            membership.setGroup(destinationGroup);
            toUpdate.add(membership);
        }

        classroomMemberRepository.saveAll(toUpdate);

        return orderedUniqueIds.stream()
            .map(membershipByClassroomId::get)
            .map(ClassroomMember::getClassroom)
            .map(this::toClassroomResponse)
            .toList();
    }

    private boolean upsertStudentMembership(Classroom classroom, User user) {
        ClassroomMember existing = classroomMemberRepository.findByClassroomIdAndUserId(classroom.getId(), user.getId()).orElse(null);
        if (existing != null) {
            if (!existing.isActive()) {
                existing.setActive(true);
                existing.setLeftAt(null);
                existing.setRemovedBy(null);
                existing.setRole(ClassroomRole.STUDENT);
                existing.setCanManageExams(false);
                existing.setCanManageStudents(false);
                existing.setCanManageGrades(false);
                existing.setGroup(null);
                existing.setOrderIndex(allocateOrderIndex(user.getId()));
                classroomMemberRepository.save(existing);
                return true;
            }
            return false;
        }

        double orderIndex = allocateOrderIndex(user.getId());
        ClassroomMember newMember = ClassroomMember.builder()
            .classroom(classroom)
            .user(user)
            .role(ClassroomRole.STUDENT)
            .group(null)
            .orderIndex(orderIndex)
            .build();
        classroomMemberRepository.save(newMember);
        return true;
    }

    public MyClassroomResponse moveClassroom(UUID userId, UUID classroomId, UUID groupId, UUID previousSiblingId) {
        ClassroomMember member = classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(classroomId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Classroom membership not found"));

        if (groupId != null) {
            var group = classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Classroom group not found: " + groupId));
            member.setGroup(group);
        } else {
            member.setGroup(null);
        }

        double orderIndex = allocateOrderIndex(userId, previousSiblingId, classroomId);
        member.setOrderIndex(orderIndex);
        ClassroomMember saved = classroomMemberRepository.save(member);

        return new MyClassroomResponse(
            saved.getClassroom().getId(),
            saved.getClassroom().getName(),
            saved.getClassroom().getDescription(),
            saved.getRole(),
            saved.isCanManageExams(),
            saved.isCanManageStudents(),
            saved.isCanManageGrades(),
            saved.getGroup() != null ? saved.getGroup().getId() : null,
            saved.getOrderIndex(),
            saved.getJoinedAt(),
            saved.getClassroom().getCreatedAt()
        );
    }

    private double allocateOrderIndex(UUID userId) {
        return allocateOrderIndex(userId, null, null);
    }

    private double allocateOrderIndex(UUID userId, UUID previousSiblingId, UUID currentMemberId) {
        ClassroomMember previous = null;
        if (previousSiblingId != null) {
            if (previousSiblingId.equals(currentMemberId)) {
                throw new DomainBoundaryViolationException("Classroom cannot be placed relative to itself");
            }
            previous = classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(previousSiblingId, userId)
                .orElseThrow(() -> new DomainBoundaryViolationException(
                    "Previous sibling classroom not found"
                ));
        }

        Optional<ClassroomMember> next = findNextMember(userId, previous);
        Double prevIndex = previous == null ? null : previous.getOrderIndex();
        Double nextIndex = next.map(ClassroomMember::getOrderIndex).orElse(null);

        Optional<Double> allocated = SortOrderUtil.tryAllocate(prevIndex, nextIndex);
        if (allocated.isPresent()) {
            return allocated.get();
        }

        reindexClassrooms(userId);
        ClassroomMember refreshedPrev = null;
        if (previousSiblingId != null) {
            refreshedPrev = classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(previousSiblingId, userId)
                .orElseThrow(() -> new IllegalStateException("Classroom membership disappeared after reindex"));
        }
        Optional<ClassroomMember> refreshedNext = findNextMember(userId, refreshedPrev);
        Double refreshedNextIndex = refreshedNext.map(ClassroomMember::getOrderIndex).orElse(null);
        if (refreshedPrev == null) {
            return SortOrderUtil.beforeFirst(refreshedNextIndex);
        }
        return SortOrderUtil.nextAfter(refreshedPrev.getOrderIndex(), refreshedNextIndex);
    }

    private Optional<ClassroomMember> findNextMember(UUID userId, ClassroomMember previous) {
        if (previous == null) {
            return classroomMemberRepository.findFirstByUserIdAndIsActiveTrueOrderByOrderIndexAsc(userId);
        }
        return classroomMemberRepository.findFirstByUserIdAndIsActiveTrueAndOrderIndexGreaterThanOrderByOrderIndexAsc(
            userId,
            previous.getOrderIndex()
        );
    }

    private void reindexClassrooms(UUID userId) {
        List<ClassroomMember> members = classroomMemberRepository.findByUserIdAndIsActiveTrueOrderByOrderIndexAsc(userId);
        double cursor = SortOrderUtil.DEFAULT_STRIDE;
        for (ClassroomMember member : members) {
            member.setOrderIndex(cursor);
            cursor += SortOrderUtil.DEFAULT_STRIDE;
        }
        classroomMemberRepository.saveAll(members);
    }

    private User resolveTargetUser(String identifier) {
        if (!StringUtils.hasText(identifier)) {
            throw new IllegalArgumentException("Invite identifier cannot be empty");
        }

        String trimmed = identifier.trim();
        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(trimmed, trimmed)
            .orElseThrow(() -> new IllegalArgumentException("User not found for identifier: " + trimmed));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private Classroom findClassroom(UUID classroomId) {
        return classroomRepository.findById(classroomId)
            .orElseThrow(() -> new IllegalArgumentException("Classroom not found: " + classroomId));
    }

    private String generateUniqueToken() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String token = randomToken(8);
            if (!classroomInviteLinkRepository.existsByToken(token)) {
                return token;
            }
        }

        throw new IllegalStateException("Unable to allocate unique invite token");
    }

    private static String randomToken(@SuppressWarnings("SameParameterValue") int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = ThreadLocalRandom.current().nextInt(TOKEN_ALPHABET.length());
            sb.append(TOKEN_ALPHABET.charAt(index));
        }
        return sb.toString();
    }

    private ClassroomResponse toClassroomResponse(Classroom classroom) {
        return new ClassroomResponse(
            classroom.getId(),
            classroom.getName(),
            classroom.getDescription(),
            classroom.getCreatedBy().getId(),
            classroom.getCreatedAt()
        );
    }

    private ClassroomMemberResponse toMemberResponse(ClassroomMember member) {
        return new ClassroomMemberResponse(
            member.getId(),
            member.getUser().getId(),
            member.getUser().getUsername(),
            member.getUser().getFirstName(),
            member.getUser().getMiddleName(),
            member.getUser().getLastName(),
            member.getUser().getEmail(),
            member.getRole(),
            member.isCanManageExams(),
            member.isCanManageStudents(),
            member.isCanManageGrades(),
            member.getJoinedAt(),
            member.isActive()
        );
    }

    private ClassroomInviteResponse toInviteResponse(ClassroomInvite invite) {
        return toInviteResponse(invite, Instant.now());
    }

    private ClassroomInviteResponse toInviteResponse(ClassroomInvite invite, Instant now) {
        ClassroomInviteStatus status = getEffectiveInviteStatus(invite, now);
        boolean isAlreadyMember = classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(
            invite.getClassroom().getId(),
            invite.getTargetUser().getId()
        ).isPresent();
        return new ClassroomInviteResponse(
            invite.getId(),
            invite.getClassroom().getId(),
            invite.getClassroom().getName(),
            invite.getClassroom().getDescription(),
            invite.getInvitedBy().getId(),
            invite.getInvitedBy().getUsername(),
            invite.getInvitedBy().getFirstName(),
            invite.getInvitedBy().getMiddleName(),
            invite.getInvitedBy().getLastName(),
            invite.getTargetUser().getId(),
            invite.getTargetUser().getUsername(),
            invite.getTargetUser().getFirstName(),
            invite.getTargetUser().getMiddleName(),
            invite.getTargetUser().getLastName(),
            invite.getTargetUser().getEmail(),
            status,
            status == ClassroomInviteStatus.PENDING,
            isAlreadyMember,
            invite.getCreatedAt(),
            invite.getExpiresAt(),
            invite.getRespondedAt()
        );
    }

    private static ClassroomInviteStatus getEffectiveInviteStatus(ClassroomInvite invite, Instant now) {
        if (invite.getStatus() != ClassroomInviteStatus.PENDING) {
            return invite.getStatus();
        }
        return isInviteExpired(invite, now) ? ClassroomInviteStatus.EXPIRED : ClassroomInviteStatus.PENDING;
    }

    private static boolean isInviteExpired(ClassroomInvite invite, Instant now) {
        Instant expiresAt = invite.getExpiresAt();
        if (expiresAt == null) {
            // Backward-compatible fallback for legacy rows that predate expiresAt.
            expiresAt = invite.getCreatedAt().plus(USER_INVITE_EXPIRATION);
        }
        return !expiresAt.isAfter(now);
    }

    private ClassroomInviteLinkResponse toInviteLinkResponse(ClassroomInviteLink link) {
        return new ClassroomInviteLinkResponse(
            link.getId(),
            link.getClassroom().getId(),
            link.getToken(),
            link.getExpiresAt(),
            link.getMaxUses(),
            link.getUseCount(),
            isRevoked(link),
            isExpired(link),
            isCapacityReached(link),
            link.getCreatedAt()
        );
    }

    private static boolean isRevoked(ClassroomInviteLink link) {
        return link.getRevokedAt() != null;
    }

    private static boolean isExpired(ClassroomInviteLink link) {
        return link.getExpiresAt() != null && link.getExpiresAt().isBefore(Instant.now());
    }

    private static boolean isCapacityReached(ClassroomInviteLink link) {
        return link.getMaxUses() != null && link.getUseCount() >= link.getMaxUses();
    }
}
