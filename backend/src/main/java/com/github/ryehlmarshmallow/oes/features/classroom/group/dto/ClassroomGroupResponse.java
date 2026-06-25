package com.github.ryehlmarshmallow.oes.features.classroom.group.dto;

import java.time.Instant;
import java.util.UUID;

public record ClassroomGroupResponse(
    UUID id,
    String name,
    Instant createdAt,
    Double orderIndex
) {
}
