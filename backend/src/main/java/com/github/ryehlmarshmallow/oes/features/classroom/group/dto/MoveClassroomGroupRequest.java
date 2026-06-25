package com.github.ryehlmarshmallow.oes.features.classroom.group.dto;

import java.util.UUID;

public record MoveClassroomGroupRequest(
    UUID previousSiblingId
) {
}
