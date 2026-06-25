package com.github.ryehlmarshmallow.oes.features.identity.dto;

import jakarta.validation.constraints.Email;

public record ResendVerificationRequest(
    @Email(message = "Email must be valid") String email
) {
}

