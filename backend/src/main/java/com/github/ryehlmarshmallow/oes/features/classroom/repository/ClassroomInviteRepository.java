package com.github.ryehlmarshmallow.oes.features.classroom.repository;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomInvite;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomInviteStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassroomInviteRepository extends JpaRepository<ClassroomInvite, UUID> {

    @EntityGraph(attributePaths = {"classroom", "targetUser", "invitedBy"})
    Optional<ClassroomInvite> findDetailedById(UUID id);

    @EntityGraph(attributePaths = {"classroom", "targetUser", "invitedBy"})
    List<ClassroomInvite> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId);

    @EntityGraph(attributePaths = {"classroom", "targetUser", "invitedBy"})
    List<ClassroomInvite> findByClassroomIdOrderByCreatedAtDesc(UUID classroomId);

    Optional<ClassroomInvite> findByClassroomIdAndTargetUserIdAndStatus(UUID classroomId, UUID targetUserId, ClassroomInviteStatus status);

    long countByClassroomIdAndStatusAndExpiresAtAfter(UUID classroomId, ClassroomInviteStatus status, Instant now);

    void deleteByClassroomIdAndStatusNot(UUID classroomId, ClassroomInviteStatus status);
}

