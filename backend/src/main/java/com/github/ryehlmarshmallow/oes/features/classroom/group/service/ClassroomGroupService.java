package com.github.ryehlmarshmallow.oes.features.classroom.group.service;

import com.github.ryehlmarshmallow.oes.features.classroom.group.dto.ClassroomGroupResponse;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.group.entity.ClassroomGroup;
import com.github.ryehlmarshmallow.oes.features.classroom.group.repository.ClassroomGroupRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.questionset.util.SortOrderUtil;
import com.github.ryehlmarshmallow.oes.common.exception.DomainBoundaryViolationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassroomGroupService {

    public static final String RESERVED_GROUP_NAME = "Other";

    private final ClassroomGroupRepository classroomGroupRepository;
    private final ClassroomMemberRepository classroomMemberRepository;
    private final UserRepository userRepository;

    public ClassroomGroupResponse createGroup(UUID userId, String name) {
        User owner = findUser(userId);
        validateName(name);

        double orderIndex = allocateOrderIndex(userId);
        ClassroomGroup group = ClassroomGroup.builder()
            .name(name.trim())
            .ownerUser(owner)
            .orderIndex(orderIndex)
            .build();

        return toResponse(classroomGroupRepository.save(group));
    }

    public ClassroomGroupResponse renameGroup(UUID userId, UUID groupId, String name) {
        validateName(name);
        ClassroomGroup group = requireGroupOwnedByUser(groupId, userId);
        if (isReservedGroup(group)) {
            throw new IllegalArgumentException("Reserved group cannot be renamed");
        }
        group.setName(name.trim());
        return toResponse(classroomGroupRepository.save(group));
    }

    public void deleteGroup(UUID userId, UUID groupId) {
        ClassroomGroup group = requireGroupOwnedByUser(groupId, userId);
        if (isReservedGroup(group)) {
            throw new IllegalArgumentException("Reserved group cannot be deleted");
        }
        if (classroomMemberRepository.countByGroupIdAndUserIdAndIsActiveTrue(groupId, userId) > 0) {
            throw new IllegalArgumentException("Group has classrooms mapped. Move them first");
        }
        classroomGroupRepository.delete(group);
    }

    public ClassroomGroupResponse moveGroup(UUID userId, UUID groupId, UUID previousSiblingId) {
        ClassroomGroup group = requireGroupOwnedByUser(groupId, userId);
        double orderIndex = allocateOrderIndex(userId, previousSiblingId, groupId);
        group.setOrderIndex(orderIndex);
        return toResponse(classroomGroupRepository.save(group));
    }

    private double allocateOrderIndex(UUID userId) {
        return allocateOrderIndex(userId, null, null);
    }

    private double allocateOrderIndex(UUID userId, UUID previousSiblingId, UUID currentGroupId) {
        ClassroomGroup previous = null;
        if (previousSiblingId != null) {
            if (previousSiblingId.equals(currentGroupId)) {
                throw new DomainBoundaryViolationException("Group cannot be placed relative to itself");
            }
            previous = classroomGroupRepository.findByIdAndOwnerUserId(previousSiblingId, userId)
                .orElseThrow(() -> new DomainBoundaryViolationException(
                    "Previous sibling group not found"
                ));
        }

        Optional<ClassroomGroup> next = findNextGroup(userId, previous);
        Double prevIndex = previous == null ? null : previous.getOrderIndex();
        Double nextIndex = next.map(ClassroomGroup::getOrderIndex).orElse(null);

        Optional<Double> allocated = SortOrderUtil.tryAllocate(prevIndex, nextIndex);
        if (allocated.isPresent()) {
            return allocated.get();
        }

        reindexGroups(userId);
        ClassroomGroup refreshedPrev = null;
        if (previousSiblingId != null) {
            refreshedPrev = classroomGroupRepository.findByIdAndOwnerUserId(previousSiblingId, userId)
                .orElseThrow(() -> new IllegalStateException("Group disappeared after reindex"));
        }
        Optional<ClassroomGroup> refreshedNext = findNextGroup(userId, refreshedPrev);
        Double refreshedNextIndex = refreshedNext.map(ClassroomGroup::getOrderIndex).orElse(null);
        if (refreshedPrev == null) {
            return SortOrderUtil.beforeFirst(refreshedNextIndex);
        }
        return SortOrderUtil.nextAfter(refreshedPrev.getOrderIndex(), refreshedNextIndex);
    }

    private Optional<ClassroomGroup> findNextGroup(UUID userId, ClassroomGroup previous) {
        if (previous == null) {
            return classroomGroupRepository.findFirstByOwnerUserIdOrderByOrderIndexAsc(userId);
        }
        return classroomGroupRepository.findFirstByOwnerUserIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(
            userId,
            previous.getOrderIndex()
        );
    }

    private void reindexGroups(UUID userId) {
        List<ClassroomGroup> groups = classroomGroupRepository.findByOwnerUserIdOrderByOrderIndexAsc(userId);
        double cursor = SortOrderUtil.DEFAULT_STRIDE;
        for (ClassroomGroup group : groups) {
            group.setOrderIndex(cursor);
            cursor += SortOrderUtil.DEFAULT_STRIDE;
        }
        classroomGroupRepository.saveAll(groups);
    }

    private ClassroomGroup requireGroupOwnedByUser(UUID groupId, UUID userId) {
        return classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Classroom group not found: " + groupId));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private static void validateName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Group name cannot be empty");
        }
        if (RESERVED_GROUP_NAME.equalsIgnoreCase(name.trim())) {
            throw new IllegalArgumentException("\"Other\" is reserved and cannot be used for custom groups");
        }
    }

    private static boolean isReservedGroup(ClassroomGroup group) {
        return RESERVED_GROUP_NAME.equalsIgnoreCase(group.getName());
    }

    public List<ClassroomGroupResponse> listGroups(UUID userId) {
        return classroomGroupRepository.findByOwnerUserIdOrderByOrderIndexAsc(userId).stream()
            .map(ClassroomGroupService::toResponse)
            .toList();
    }

    private static ClassroomGroupResponse toResponse(ClassroomGroup group) {
        return new ClassroomGroupResponse(
            group.getId(),
            group.getName(),
            group.getCreatedAt(),
            group.getOrderIndex()
        );
    }
}
