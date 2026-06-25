package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import java.util.List;
import java.util.UUID;

public record QuestionSetDetailResponse(
    UUID id,
    String name,
    List<QuestionGroupRequest> questionGroups
) {
}
