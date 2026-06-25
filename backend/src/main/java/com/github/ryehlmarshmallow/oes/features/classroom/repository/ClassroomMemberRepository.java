package com.github.ryehlmarshmallow.oes.features.classroom.repository;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomMember;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassroomMemberRepository extends JpaRepository<ClassroomMember, UUID> {

    Optional<ClassroomMember> findByClassroomIdAndUserId(UUID classroomId, UUID userId);

    Optional<ClassroomMember> findByClassroomIdAndUserIdAndIsActiveTrue(UUID classroomId, UUID userId);

    @EntityGraph(attributePaths = {"classroom", "group"})
    List<ClassroomMember> findByUserIdAndIsActiveTrueOrderByOrderIndexAsc(UUID userId);

    Optional<ClassroomMember> findFirstByUserIdAndIsActiveTrueOrderByOrderIndexAsc(UUID userId);

    Optional<ClassroomMember> findFirstByUserIdAndIsActiveTrueAndOrderIndexGreaterThanOrderByOrderIndexAsc(
        UUID userId,
        Double orderIndex
    );

    @EntityGraph(attributePaths = {"user"})
    List<ClassroomMember> findByClassroomIdAndIsActiveTrueOrderByJoinedAtAsc(UUID classroomId);

    List<ClassroomMember> findByUserIdAndClassroomIdInAndIsActiveTrue(UUID userId, List<UUID> classroomIds);

    long countByGroupIdAndUserIdAndIsActiveTrue(UUID groupId, UUID userId);

    long countByClassroomIdAndRoleAndIsActiveTrue(UUID classroomId, ClassroomRole role);

    long countByClassroomIdAndIsActiveTrue(UUID classroomId);
}
