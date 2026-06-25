package com.github.ryehlmarshmallow.oes.features.identity.dto;

import jakarta.validation.constraints.NotBlank;

public record AuthRequest(
    @NotBlank String identifier,
    @NotBlank String password
) {
}
