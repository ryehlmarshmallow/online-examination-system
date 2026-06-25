package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import com.github.ryehlmarshmallow.oes.features.questionset.entity.DomainType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SaveTemplateAsRequest(
    @NotNull DomainType targetDomain,
    UUID parentId,
    @NotBlank String name
) {
}
