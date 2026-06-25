package com.github.ryehlmarshmallow.oes.features.classroom.service;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.*;
import com.github.ryehlmarshmallow.oes.features.classroom.group.repository.ClassroomGroupRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomInviteLinkRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomInviteRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.notification.event.ClassroomInvitationEvent;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClassroomServiceTest {

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private ClassroomMemberRepository classroomMemberRepository;

    @Mock
    private ClassroomInviteRepository classroomInviteRepository;

    @Mock
    private ClassroomInviteLinkRepository classroomInviteLinkRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClassroomAuthorizationService classroomAuthorizationService;

    @Mock
    private ClassroomGroupRepository classroomGroupRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Captor
    private ArgumentCaptor<ClassroomMember> memberCaptor;

    @Captor
    private ArgumentCaptor<ClassroomInviteLink> linkCaptor;

    @Captor
    private ArgumentCaptor<ClassroomInvite> inviteCaptor;

    @Test
    void shouldCreateOwnerMembershipWithAllPermissions() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID userId = UUID.randomUUID();
        User owner = User.builder().id(userId).username("owner").email("owner@example.com").build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(owner));
        when(classroomRepository.save(any(Classroom.class))).thenAnswer(invocation -> {
            Classroom classroom = invocation.getArgument(0);
            classroom.setId(UUID.randomUUID());
            return classroom;
        });

        var response = service.createClassroom(userId, "Class A", "desc");

        verify(classroomMemberRepository).save(memberCaptor.capture());
        ClassroomMember savedMember = memberCaptor.getValue();

        assertEquals(ClassroomRole.OWNER, savedMember.getRole());
        assertTrue(savedMember.isCanManageExams());
        assertTrue(savedMember.isCanManageStudents());
        assertTrue(savedMember.isCanManageGrades());
        assertEquals("Class A", response.name());
    }

    @Test
    void shouldBindInviteToResolvedUserId() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID classroomId = UUID.randomUUID();
        UUID inviterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User inviter = User.builder().id(inviterId).username("staff").email("staff@example.com").build();
        User target = User.builder().id(targetId).username("student").email("student@example.com").build();
        Classroom classroom = Classroom.builder().id(classroomId).name("Class A").build();

        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(userRepository.findById(inviterId)).thenReturn(Optional.of(inviter));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("student@example.com", "student@example.com"))
            .thenReturn(Optional.of(target));
        when(classroomMemberRepository.countByClassroomIdAndIsActiveTrue(classroomId)).thenReturn(0L);
        when(classroomInviteRepository.countByClassroomIdAndStatusAndExpiresAtAfter(eq(classroomId), eq(ClassroomInviteStatus.PENDING), any(Instant.class))).thenReturn(0L);
        when(classroomInviteRepository.save(any(ClassroomInvite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Instant before = Instant.now();
        service.inviteUser(inviterId, classroomId, "student@example.com");
        Instant after = Instant.now();

        verify(classroomInviteRepository).save(inviteCaptor.capture());
        assertEquals(targetId, inviteCaptor.getValue().getTargetUser().getId());
        assertEquals(ClassroomInviteStatus.PENDING, inviteCaptor.getValue().getStatus());
        assertFalse(inviteCaptor.getValue().getExpiresAt().isBefore(before.plus(Duration.ofDays(7))));
        assertFalse(inviteCaptor.getValue().getExpiresAt().isAfter(after.plus(Duration.ofDays(7))));

        ArgumentCaptor<ClassroomInvitationEvent> eventCaptor = ArgumentCaptor.forClass(ClassroomInvitationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        ClassroomInvitationEvent event = eventCaptor.getValue();
        assertEquals(classroomId, event.getClassroomId());
        assertEquals(targetId, event.getTargetUserId());
        assertEquals("staff", event.getInviterName());
        assertEquals("Class A", event.getClassroomName());
    }

    @Test
    void shouldRenderPendingInviteAsExpiredWhenExpiresAtIsPast() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID inviteeId = UUID.randomUUID();
        User inviter = User.builder().id(UUID.randomUUID()).username("staff").email("staff@example.com").build();
        User invitee = User.builder().id(inviteeId).username("student").email("student@example.com").build();
        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).name("Class A").build();

        ClassroomInvite expiredPendingInvite = ClassroomInvite.builder()
            .id(UUID.randomUUID())
            .classroom(classroom)
            .targetUser(invitee)
            .invitedBy(inviter)
            .status(ClassroomInviteStatus.PENDING)
            .createdAt(Instant.now().minus(Duration.ofDays(10)))
            .expiresAt(Instant.now().minusSeconds(1))
            .build();

        when(classroomInviteRepository.findByTargetUserIdOrderByCreatedAtDesc(inviteeId))
            .thenReturn(List.of(expiredPendingInvite));

        var responses = service.listMyInvites(inviteeId);

        assertEquals(1, responses.size());
        assertEquals(ClassroomInviteStatus.EXPIRED, responses.get(0).status());
        assertFalse(responses.get(0).actionable());
    }

    @Test
    void shouldRejectAcceptWhenPendingInviteIsExpired() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID inviteId = UUID.randomUUID();
        UUID inviteeId = UUID.randomUUID();
        User inviter = User.builder().id(UUID.randomUUID()).username("staff").email("staff@example.com").build();
        User invitee = User.builder().id(inviteeId).username("student").email("student@example.com").build();
        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).name("Class A").build();

        ClassroomInvite expiredPendingInvite = ClassroomInvite.builder()
            .id(inviteId)
            .classroom(classroom)
            .targetUser(invitee)
            .invitedBy(inviter)
            .status(ClassroomInviteStatus.PENDING)
            .createdAt(Instant.now().minus(Duration.ofDays(10)))
            .expiresAt(Instant.now().minusSeconds(1))
            .build();

        when(classroomInviteRepository.findDetailedById(inviteId)).thenReturn(Optional.of(expiredPendingInvite));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> service.acceptInvite(inviteeId, inviteId));

        assertEquals("Invite has expired", ex.getMessage());
        verify(classroomInviteRepository, never()).save(any(ClassroomInvite.class));
    }

    @Test
    void shouldCreateNewInviteWhenExistingPendingInviteIsExpired() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID classroomId = UUID.randomUUID();
        UUID inviterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User inviter = User.builder().id(inviterId).username("staff").email("staff@example.com").build();
        User target = User.builder().id(targetId).username("student").email("student@example.com").build();
        Classroom classroom = Classroom.builder().id(classroomId).name("Class A").build();

        ClassroomInvite expiredPendingInvite = ClassroomInvite.builder()
            .id(UUID.randomUUID())
            .classroom(classroom)
            .targetUser(target)
            .invitedBy(inviter)
            .status(ClassroomInviteStatus.PENDING)
            .createdAt(Instant.now().minus(Duration.ofDays(10)))
            .expiresAt(Instant.now().minusSeconds(1))
            .build();

        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(userRepository.findById(inviterId)).thenReturn(Optional.of(inviter));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("student@example.com", "student@example.com"))
            .thenReturn(Optional.of(target));
        when(classroomInviteRepository.findByClassroomIdAndTargetUserIdAndStatus(classroomId, targetId, ClassroomInviteStatus.PENDING))
            .thenReturn(Optional.of(expiredPendingInvite));
        when(classroomMemberRepository.countByClassroomIdAndIsActiveTrue(classroomId)).thenReturn(0L);
        when(classroomInviteRepository.countByClassroomIdAndStatusAndExpiresAtAfter(eq(classroomId), eq(ClassroomInviteStatus.PENDING), any(Instant.class))).thenReturn(0L);
        when(classroomInviteRepository.save(any(ClassroomInvite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.inviteUser(inviterId, classroomId, "student@example.com");

        verify(classroomInviteRepository).save(inviteCaptor.capture());
        assertNotEquals(expiredPendingInvite.getId(), inviteCaptor.getValue().getId());
        assertEquals(ClassroomInviteStatus.PENDING, inviteCaptor.getValue().getStatus());
        assertTrue(inviteCaptor.getValue().getExpiresAt().isAfter(Instant.now()));

        verify(eventPublisher).publishEvent(any(ClassroomInvitationEvent.class));
    }

    @Test
    void shouldRejectInviteLinkExpirationBeyondThirtyDays() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> service.createInviteLink(UUID.randomUUID(), UUID.randomUUID(), Instant.now().plus(Duration.ofDays(31)), 10)
        );

        assertEquals("Invite link expiration cannot be more than 30 days from now", ex.getMessage());
    }

    @Test
    void shouldAllowInviteLinkExpirationWithinThirtyDays() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID classroomId = UUID.randomUUID();
        UUID creatorId = UUID.randomUUID();

        Classroom classroom = Classroom.builder().id(classroomId).name("Class A").build();
        User creator = User.builder().id(creatorId).username("owner").email("owner@example.com").build();

        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(classroomInviteLinkRepository.existsByToken(any(String.class))).thenReturn(false);
        when(classroomInviteLinkRepository.save(any(ClassroomInviteLink.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createInviteLink(creatorId, classroomId, Instant.now().plus(Duration.ofDays(30)), 10);

        assertNotNull(response);
    }

    @Test
    void shouldGenerateEightCharLowercaseDigitToken() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID classroomId = UUID.randomUUID();
        UUID creatorId = UUID.randomUUID();

        Classroom classroom = Classroom.builder().id(classroomId).name("Class A").build();
        User creator = User.builder().id(creatorId).username("owner").email("owner@example.com").build();

        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(classroomInviteLinkRepository.existsByToken(any(String.class))).thenReturn(false);
        when(classroomInviteLinkRepository.save(any(ClassroomInviteLink.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createInviteLink(creatorId, classroomId, Instant.now().plusSeconds(3600), 10);

        verify(classroomInviteLinkRepository).save(linkCaptor.capture());
        String token = linkCaptor.getValue().getToken();
        assertTrue(token.matches("^[a-z0-9]{8}$"));
        assertEquals(token, response.token());
    }

    @Test
    void shouldRejectInviteWhenCapacityLimitReached() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID classroomId = UUID.randomUUID();
        UUID inviterId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        User inviter = User.builder().id(inviterId).username("staff").email("staff@example.com").build();
        User target = User.builder().id(targetId).username("student").email("student@example.com").build();
        Classroom classroom = Classroom.builder().id(classroomId).name("Class A").build();

        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(userRepository.findById(inviterId)).thenReturn(Optional.of(inviter));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("student@example.com", "student@example.com"))
            .thenReturn(Optional.of(target));
        when(classroomMemberRepository.countByClassroomIdAndIsActiveTrue(classroomId)).thenReturn(60L);
        when(classroomInviteRepository.countByClassroomIdAndStatusAndExpiresAtAfter(eq(classroomId), eq(ClassroomInviteStatus.PENDING), any(Instant.class))).thenReturn(40L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            service.inviteUser(inviterId, classroomId, "student@example.com")
        );

        assertTrue(ex.getMessage().contains("capacity limit reached"));
        verify(classroomInviteRepository, never()).save(any(ClassroomInvite.class));
    }

    @Test
    void shouldGetInviteDetails() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID inviteId = UUID.randomUUID();
        UUID inviteeId = UUID.randomUUID();
        User inviter = User.builder().id(UUID.randomUUID()).username("staff").firstName("Staff").lastName("User").build();
        User invitee = User.builder().id(inviteeId).username("student").email("student@example.com").build();
        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).name("Class A").description("Test Classroom").build();

        ClassroomInvite invite = ClassroomInvite.builder()
            .id(inviteId)
            .classroom(classroom)
            .targetUser(invitee)
            .invitedBy(inviter)
            .status(ClassroomInviteStatus.PENDING)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plus(Duration.ofDays(7)))
            .build();

        when(classroomInviteRepository.findDetailedById(inviteId)).thenReturn(Optional.of(invite));
        when(classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(classroom.getId(), inviteeId))
            .thenReturn(Optional.empty());

        var response = service.getInvite(inviteeId, inviteId);

        assertEquals(inviteId, response.id());
        assertEquals("Class A", response.classroomName());
        assertEquals("Test Classroom", response.classroomDescription());
        assertEquals("Staff User", (response.invitedByFirstName() + " " + response.invitedByLastName()).trim());
        assertFalse(response.alreadyMember());
        assertTrue(response.actionable());
    }

    @Test
    void shouldRejectInviteSuccessfully() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        UUID inviteId = UUID.randomUUID();
        UUID inviteeId = UUID.randomUUID();
        User inviter = User.builder().id(UUID.randomUUID()).username("staff").build();
        User invitee = User.builder().id(inviteeId).username("student").build();
        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).name("Class A").build();

        ClassroomInvite invite = ClassroomInvite.builder()
            .id(inviteId)
            .classroom(classroom)
            .targetUser(invitee)
            .invitedBy(inviter)
            .status(ClassroomInviteStatus.PENDING)
            .createdAt(Instant.now())
            .expiresAt(Instant.now().plus(Duration.ofDays(7)))
            .build();

        when(classroomInviteRepository.findDetailedById(inviteId)).thenReturn(Optional.of(invite));
        when(classroomInviteRepository.save(any(ClassroomInvite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.rejectInvite(inviteeId, inviteId);

        assertEquals(ClassroomInviteStatus.REJECTED, response.status());
        assertFalse(response.actionable());
        assertNotNull(response.respondedAt());
    }

    @Test
    void shouldGetInviteLinkDetailsSuccessfully() {
        ClassroomService service = new ClassroomService(
            classroomRepository,
            classroomMemberRepository,
            classroomInviteRepository,
            classroomInviteLinkRepository,
            userRepository,
            classroomAuthorizationService,
            classroomGroupRepository,
            eventPublisher
        );

        String token = "abc12345";
        UUID requesterId = UUID.randomUUID();
        User creator = User.builder().id(UUID.randomUUID()).username("staff").firstName("Staff").lastName("User").build();
        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).name("Class A").description("Test Link Desc").build();

        ClassroomInviteLink link = ClassroomInviteLink.builder()
            .token(token)
            .classroom(classroom)
            .createdBy(creator)
            .expiresAt(Instant.now().plus(Duration.ofDays(7)))
            .maxUses(10)
            .useCount(2)
            .build();

        when(classroomInviteLinkRepository.findDetailedByToken(token)).thenReturn(Optional.of(link));
        when(classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(classroom.getId(), requesterId))
            .thenReturn(Optional.empty());

        var response = service.getInviteLinkDetails(requesterId, token);

        assertEquals(token, response.token());
        assertEquals("Class A", response.classroomName());
        assertEquals("Test Link Desc", response.classroomDescription());
        assertEquals("Staff User", (response.invitedByFirstName() + " " + response.invitedByLastName()).trim());
        assertFalse(response.expired());
        assertFalse(response.alreadyMember());
    }
}

