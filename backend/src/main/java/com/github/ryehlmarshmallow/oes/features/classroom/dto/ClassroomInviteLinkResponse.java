package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import java.time.Instant;
import java.util.UUID;

public record ClassroomInviteLinkResponse(
    UUID id,
    UUID classroomId,
    String token,
    Instant expiresAt,
    Integer maxUses,
    int useCount,
    boolean revoked,
    boolean expired,
    boolean capacityReached,
    Instant createdAt
) {
}

