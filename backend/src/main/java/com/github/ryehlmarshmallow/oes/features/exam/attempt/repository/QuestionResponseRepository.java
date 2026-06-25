package com.github.ryehlmarshmallow.oes.features.exam.attempt.repository;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuestionResponseRepository extends JpaRepository<QuestionResponse, UUID> {
    Optional<QuestionResponse> findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(UUID attemptId, UUID questionId);
}

