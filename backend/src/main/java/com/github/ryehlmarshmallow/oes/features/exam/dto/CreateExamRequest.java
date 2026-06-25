package com.github.ryehlmarshmallow.oes.features.exam.dto;

import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentGradeVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentAnswerVisibilityMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record CreateExamRequest(
    @NotNull UUID templateId,
    String title, // Optional, defaults to template title
    @NotNull UUID classroomId,
    StudentGradeVisibilityMode studentGradeVisibilityMode,
    StudentAnswerVisibilityMode studentAnswerVisibilityMode,
    Instant startTime,
    Instant endTime,
    Long duration,
    Integer maxAttempts,
    UUID groupId,
    UUID previousSiblingId
) {
}

