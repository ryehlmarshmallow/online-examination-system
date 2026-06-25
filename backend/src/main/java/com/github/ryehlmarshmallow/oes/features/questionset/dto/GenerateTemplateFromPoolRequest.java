package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record GenerateTemplateFromPoolRequest(
    @NotBlank String name,
    UUID parentId,
    Integer randomCount
) {
}
