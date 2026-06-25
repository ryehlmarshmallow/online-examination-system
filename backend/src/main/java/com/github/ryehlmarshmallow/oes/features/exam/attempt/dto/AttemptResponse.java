package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;

import java.time.Instant;
import java.util.UUID;

public record AttemptResponse(
    UUID attemptId,
    Integer attemptNumber,
    ExamAttempt.Status status,
    Instant startedAt,
    Instant submittedAt,
    Instant calculatedDeadline,
    Instant serverTime,
    UUID studentId,
    String studentName
) {
}
