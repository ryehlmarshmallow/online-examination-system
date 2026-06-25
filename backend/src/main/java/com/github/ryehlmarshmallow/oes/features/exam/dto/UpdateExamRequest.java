package com.github.ryehlmarshmallow.oes.features.exam.dto;

import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentGradeVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentAnswerVisibilityMode;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.UUID;

public record UpdateExamRequest(
    @NotBlank String title,
    StudentGradeVisibilityMode studentGradeVisibilityMode,
    StudentAnswerVisibilityMode studentAnswerVisibilityMode,
    Instant startTime,
    Instant endTime,
    Long duration,
    Integer maxAttempts,
    UUID groupId
) {
}

