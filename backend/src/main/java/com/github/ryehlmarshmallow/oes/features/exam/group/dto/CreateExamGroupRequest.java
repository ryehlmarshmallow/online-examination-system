package com.github.ryehlmarshmallow.oes.features.exam.group.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateExamGroupRequest(
    @NotBlank String name
) {
}
