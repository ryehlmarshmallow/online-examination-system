package com.github.ryehlmarshmallow.oes.features.classroom.group.dto;

import jakarta.validation.constraints.NotBlank;

public record RenameClassroomGroupRequest(
    @NotBlank String name
) {
}
