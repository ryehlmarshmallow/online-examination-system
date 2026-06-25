package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record BulkMoveClassroomGroupRequest(
    @NotEmpty List<UUID> classroomIds,
    UUID groupId
) {
}

