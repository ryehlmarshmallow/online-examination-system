package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import com.github.ryehlmarshmallow.oes.features.questionset.entity.NodeType;

import java.time.Instant;
import java.util.UUID;

public record NodeResponse(
    UUID id,
    String name,
    NodeType nodeType,
    UUID parentId,
    String path,
    double orderIndex,
    Instant createdAt,
    Instant modifiedAt
) {
}
