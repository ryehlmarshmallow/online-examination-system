package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import java.time.Instant;

public record CreateInviteLinkRequest(
    Instant expiresAt,
    Integer maxUses
) {
}

