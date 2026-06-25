package com.github.ryehlmarshmallow.oes.features.exam.group.dto;

import java.time.Instant;
import java.util.UUID;

public record ExamGroupResponse(
    UUID id,
    String name,
    Instant createdAt
) {
}
