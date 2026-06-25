package com.github.ryehlmarshmallow.oes.features.exam.repository;

import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamRepository extends JpaRepository<Exam, UUID> {

    @EntityGraph(attributePaths = {
        "classroom",
        "examQuestionGroups",
        "examQuestionGroups.questionGroup",
        "examQuestionGroups.questionGroup.questions"
    })
    Optional<Exam> findDetailedById(UUID id);

    @EntityGraph(attributePaths = {
        "classroom",
        "examQuestionGroups"
    })
    List<Exam> findByClassroomIdOrderByOrderIndexAsc(UUID classroomId);

    Optional<Exam> findFirstByClassroomIdOrderByOrderIndexAsc(UUID classroomId);

    Optional<Exam> findFirstByClassroomIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(
        UUID classroomId,
        Double orderIndex
    );

    Optional<Exam> findByIdAndClassroomId(UUID id, UUID classroomId);

    List<Exam> findByGroupId(UUID groupId);

    long countByGroupId(UUID groupId);
}

