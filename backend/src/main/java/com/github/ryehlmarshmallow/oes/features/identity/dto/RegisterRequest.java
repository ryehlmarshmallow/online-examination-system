package com.github.ryehlmarshmallow.oes.features.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Size(max = 100) String firstName,
    @Size(max = 100) String middleName,
    @NotBlank @Size(max = 100) String lastName,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters long") String password
) {
}