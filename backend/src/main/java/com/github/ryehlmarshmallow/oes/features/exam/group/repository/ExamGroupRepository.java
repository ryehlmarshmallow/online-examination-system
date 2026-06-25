package com.github.ryehlmarshmallow.oes.features.exam.group.repository;

import com.github.ryehlmarshmallow.oes.features.exam.group.entity.ExamGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamGroupRepository extends JpaRepository<ExamGroup, UUID> {

    Optional<ExamGroup> findByIdAndClassroomId(UUID id, UUID classroomId);

    List<ExamGroup> findByClassroomIdOrderByCreatedAtAsc(UUID classroomId);
}

