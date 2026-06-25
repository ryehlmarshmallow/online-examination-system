package com.github.ryehlmarshmallow.oes.features.exam.attempt.repository;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;
import java.util.UUID;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {

    @EntityGraph(attributePaths = {
        "responses",
        "responses.question",
        "exam",
        "exam.examQuestionGroups",
        "exam.examQuestionGroups.questionGroup",
        "exam.examQuestionGroups.questionGroup.questions"
    })
    Optional<ExamAttempt> findDetailedById(UUID attemptId);

    @Query("""
        SELECT q
        FROM ExamAttempt a
        JOIN a.exam e
        JOIN e.examQuestionGroups eg
        JOIN eg.questionGroup g
        JOIN g.questions q
        WHERE a.id = :attemptId AND q.id = :questionId
        """)
    Optional<Question> findQuestionInAttempt(UUID attemptId, UUID questionId);

    @Query("""
        SELECT COUNT(DISTINCT a.student.id)
        FROM ExamAttempt a
        WHERE a.exam.id = :examId AND a.status IN :statuses
        """)
    long countDistinctStudentIdByExamIdAndStatusIn(UUID examId, Collection<ExamAttempt.Status> statuses);

    boolean existsByExamId(UUID examId);

    Optional<ExamAttempt> findFirstByExamIdAndStudentIdAndStatus(UUID examId, UUID studentId, ExamAttempt.Status status);

    long countByExamIdAndStudentId(UUID examId, UUID studentId);

    @Query("""
        SELECT a
        FROM ExamAttempt a
        WHERE a.exam.id = :examId AND a.student.id = :studentId
        ORDER BY a.submittedAt DESC NULLS FIRST, a.startedAt DESC
        """)
    List<ExamAttempt> findHistory(UUID examId, UUID studentId);

    List<ExamAttempt> findByStatus(ExamAttempt.Status status);

    List<ExamAttempt> findByExamIdAndStatus(UUID examId, ExamAttempt.Status status);

    List<ExamAttempt> findByExamId(UUID examId);
}
