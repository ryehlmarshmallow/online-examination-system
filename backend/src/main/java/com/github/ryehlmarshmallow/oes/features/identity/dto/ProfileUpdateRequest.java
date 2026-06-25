package com.github.ryehlmarshmallow.oes.features.identity.dto;

import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
    @NotBlank(message = "First name is required") String firstName,
    String middleName,
    @NotBlank(message = "Last name is required") String lastName
) {}
