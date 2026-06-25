package com.github.ryehlmarshmallow.oes.features.exam.dto;

import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionGroupRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record UpdateExamQuestionsRequest(
    @NotNull @Valid List<QuestionGroupRequest> questionGroups
) {
}
