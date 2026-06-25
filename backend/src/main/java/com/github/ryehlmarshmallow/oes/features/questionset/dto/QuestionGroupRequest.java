package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record QuestionGroupRequest(
    String prompt,
    boolean isGroup,
    @NotNull @Valid List<QuestionRequest> questions
) {
}
