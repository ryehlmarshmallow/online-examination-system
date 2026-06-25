package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import java.util.UUID;

public record MoveClassroomRequest(
    UUID groupId,
    UUID previousSiblingId
) {
}
