package com.github.ryehlmarshmallow.oes.features.identity.dto;

import com.github.ryehlmarshmallow.oes.features.identity.entity.UserRole;

public record UserResponse(
    String username,
    String firstName,
    String middleName,
    String lastName,
    String email,
    UserRole userRole
) {
}