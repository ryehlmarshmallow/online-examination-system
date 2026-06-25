package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import java.time.Instant;
import java.util.UUID;

public record GenerateExamFromPoolRequest(
    UUID poolId,
    UUID classroomId,
    String examTitle,
    int questionGroupCount,
    Instant startTime,
    Instant endTime,
    Integer duration,
    Integer maxAttempts
) {
}
