package com.github.ryehlmarshmallow.oes.features.exam.dto;

import java.util.UUID;

public record MoveExamRequest(
    UUID previousSiblingId
) {
}

