package com.github.ryehlmarshmallow.oes.features.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

public record VerifyCodeRequest(
    @NotBlank @Pattern(regexp = "\\d{6}", message = "Code must be 6 digits") String code,
    @Email(message = "Email must be valid") String email
) {
}

