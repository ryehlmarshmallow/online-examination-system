package com.github.ryehlmarshmallow.oes.features.classroom.group.service;

import com.github.ryehlmarshmallow.oes.common.exception.DomainBoundaryViolationException;
import com.github.ryehlmarshmallow.oes.features.classroom.group.dto.ClassroomGroupResponse;
import com.github.ryehlmarshmallow.oes.features.classroom.group.entity.ClassroomGroup;
import com.github.ryehlmarshmallow.oes.features.classroom.group.repository.ClassroomGroupRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClassroomGroupServiceTest {

    @Mock
    private ClassroomGroupRepository classroomGroupRepository;

    @Mock
    private ClassroomMemberRepository classroomMemberRepository;

    @Mock
    private UserRepository userRepository;

    private ClassroomGroupService classroomGroupService;

    @BeforeEach
    void setUp() {
        classroomGroupService = new ClassroomGroupService(
            classroomGroupRepository,
            classroomMemberRepository,
            userRepository
        );
    }

    @Test
    void shouldCreateGroupSuccessfully() {
        UUID userId = UUID.randomUUID();
        User owner = User.builder().id(userId).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(owner));
        when(classroomGroupRepository.findFirstByOwnerUserIdOrderByOrderIndexAsc(userId)).thenReturn(Optional.empty());

        ClassroomGroup group = ClassroomGroup.builder()
            .id(UUID.randomUUID())
            .name("Test Group")
            .ownerUser(owner)
            .orderIndex(1.0)
            .build();
        when(classroomGroupRepository.save(any(ClassroomGroup.class))).thenReturn(group);

        ClassroomGroupResponse result = classroomGroupService.createGroup(userId, "Test Group ");

        assertNotNull(result);
        assertEquals("Test Group", result.name());
        verify(classroomGroupRepository).save(any(ClassroomGroup.class));
    }

    @Test
    void shouldThrowExceptionWhenCreatingGroupWithEmptyName() {
        UUID userId = UUID.randomUUID();
        assertThrows(IllegalArgumentException.class, () -> classroomGroupService.createGroup(userId, ""));
    }

    @Test
    void shouldThrowExceptionWhenCreatingGroupWithReservedName() {
        UUID userId = UUID.randomUUID();
        assertThrows(IllegalArgumentException.class, () -> classroomGroupService.createGroup(userId, "Other"));
        assertThrows(IllegalArgumentException.class, () -> classroomGroupService.createGroup(userId, " other "));
    }

    @Test
    void shouldRenameGroupSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        ClassroomGroup group = ClassroomGroup.builder()
            .id(groupId)
            .name("Old Name")
            .build();

        when(classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)).thenReturn(Optional.of(group));
        when(classroomGroupRepository.save(any(ClassroomGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassroomGroupResponse result = classroomGroupService.renameGroup(userId, groupId, "New Name");

        assertEquals("New Name", result.name());
    }

    @Test
    void shouldThrowExceptionWhenRenamingReservedGroup() {
        UUID userId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        ClassroomGroup group = ClassroomGroup.builder()
            .id(groupId)
            .name("Other")
            .build();

        when(classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)).thenReturn(Optional.of(group));

        assertThrows(IllegalArgumentException.class, () -> classroomGroupService.renameGroup(userId, groupId, "New Name"));
    }

    @Test
    void shouldDeleteGroupSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        ClassroomGroup group = ClassroomGroup.builder()
            .id(groupId)
            .name("Group to Delete")
            .build();

        when(classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)).thenReturn(Optional.of(group));
        when(classroomMemberRepository.countByGroupIdAndUserIdAndIsActiveTrue(groupId, userId)).thenReturn(0L);

        classroomGroupService.deleteGroup(userId, groupId);

        verify(classroomGroupRepository).delete(group);
    }

    @Test
    void shouldThrowExceptionWhenDeletingGroupWithMappedClassrooms() {
        UUID userId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        ClassroomGroup group = ClassroomGroup.builder()
            .id(groupId)
            .name("Group with Classrooms")
            .build();

        when(classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)).thenReturn(Optional.of(group));
        when(classroomMemberRepository.countByGroupIdAndUserIdAndIsActiveTrue(groupId, userId)).thenReturn(1L);

        assertThrows(IllegalArgumentException.class, () -> classroomGroupService.deleteGroup(userId, groupId));
        verify(classroomGroupRepository, never()).delete(any());
    }

    @Test
    void shouldMoveGroupSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        UUID siblingId = UUID.randomUUID();

        ClassroomGroup group = ClassroomGroup.builder().id(groupId).orderIndex(2.0).build();
        ClassroomGroup sibling = ClassroomGroup.builder().id(siblingId).orderIndex(1.0).build();

        when(classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)).thenReturn(Optional.of(group));
        when(classroomGroupRepository.findByIdAndOwnerUserId(siblingId, userId)).thenReturn(Optional.of(sibling));
        when(classroomGroupRepository.findFirstByOwnerUserIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(eq(userId), eq(1.0)))
            .thenReturn(Optional.empty());
        when(classroomGroupRepository.save(any(ClassroomGroup.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassroomGroupResponse result = classroomGroupService.moveGroup(userId, groupId, siblingId);

        assertNotNull(result);
        assertTrue(result.orderIndex() > 1.0);
    }

    @Test
    void shouldThrowExceptionWhenMovingRelativeToSelf() {
        UUID userId = UUID.randomUUID();
        UUID groupId = UUID.randomUUID();
        ClassroomGroup group = ClassroomGroup.builder().id(groupId).build();
        when(classroomGroupRepository.findByIdAndOwnerUserId(groupId, userId)).thenReturn(Optional.of(group));

        assertThrows(DomainBoundaryViolationException.class, () -> classroomGroupService.moveGroup(userId, groupId, groupId));
    }
}
