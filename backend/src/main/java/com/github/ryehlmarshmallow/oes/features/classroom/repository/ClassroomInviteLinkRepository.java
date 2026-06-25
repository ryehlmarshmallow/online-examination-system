package com.github.ryehlmarshmallow.oes.features.classroom.repository;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomInviteLink;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassroomInviteLinkRepository extends JpaRepository<ClassroomInviteLink, UUID> {

    boolean existsByToken(String token);

    @EntityGraph(attributePaths = {"classroom", "createdBy"})
    Optional<ClassroomInviteLink> findDetailedByToken(String token);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT link
        FROM ClassroomInviteLink link
        WHERE link.token = :token
        """)
    @EntityGraph(attributePaths = {"classroom", "createdBy"})
    Optional<ClassroomInviteLink> findDetailedByTokenForUpdate(@Param("token") String token);

    @EntityGraph(attributePaths = {"classroom", "createdBy"})
    Optional<ClassroomInviteLink> findDetailedById(UUID id);

    @EntityGraph(attributePaths = {"classroom", "createdBy"})
    List<ClassroomInviteLink> findByClassroomIdOrderByCreatedAtDesc(UUID classroomId);
}
