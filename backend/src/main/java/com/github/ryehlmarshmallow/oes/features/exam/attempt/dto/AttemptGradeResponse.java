package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;

import java.math.BigDecimal;
import java.util.UUID;

public record AttemptGradeResponse(
    UUID attemptId,
    ExamAttempt.Status status,
    boolean gradeVisible,
    BigDecimal score,
    String reason
) {
}

