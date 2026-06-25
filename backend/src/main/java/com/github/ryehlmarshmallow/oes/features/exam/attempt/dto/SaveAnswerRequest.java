package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SaveAnswerRequest(
    @NotNull UUID questionId,
    @NotNull QuestionResponseData answerData,
    @NotNull Long sequenceNumber
) {
}
