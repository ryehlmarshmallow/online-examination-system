package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import java.util.UUID;

public record UserLookupResponse(
    UUID id,
    String username,
    String firstName,
    String middleName,
    String lastName,
    String email
) {
}

