package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import java.time.Instant;
import java.util.UUID;

public record ClassroomResponse(
    UUID id,
    String name,
    String description,
    UUID ownerUserId,
    Instant createdAt
) {
}

