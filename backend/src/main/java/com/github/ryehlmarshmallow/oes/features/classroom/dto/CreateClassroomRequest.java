package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateClassroomRequest(
    @NotBlank String name,
    String description
) {
}

