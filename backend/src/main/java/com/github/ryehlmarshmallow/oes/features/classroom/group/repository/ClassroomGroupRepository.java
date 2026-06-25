package com.github.ryehlmarshmallow.oes.features.classroom.group.repository;

import com.github.ryehlmarshmallow.oes.features.classroom.group.entity.ClassroomGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassroomGroupRepository extends JpaRepository<ClassroomGroup, UUID> {

    Optional<ClassroomGroup> findByIdAndOwnerUserId(UUID id, UUID ownerUserId);

    List<ClassroomGroup> findByOwnerUserIdOrderByOrderIndexAsc(UUID ownerUserId);

    Optional<ClassroomGroup> findFirstByOwnerUserIdOrderByOrderIndexAsc(UUID ownerUserId);

    Optional<ClassroomGroup> findFirstByOwnerUserIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(
        UUID ownerUserId,
        Double orderIndex
    );
}
