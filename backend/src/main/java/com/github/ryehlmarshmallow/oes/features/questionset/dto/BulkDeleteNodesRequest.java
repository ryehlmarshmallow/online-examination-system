package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import java.util.List;
import java.util.UUID;

public record BulkDeleteNodesRequest(
    List<UUID> nodeIds
) {
}
