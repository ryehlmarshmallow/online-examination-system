package com.github.ryehlmarshmallow.oes.features.exam.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BulkMoveExamGroupRequest(
    @NotEmpty List<UUID> examIds,
    UUID groupId
) {
}

