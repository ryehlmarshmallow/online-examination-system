package com.github.ryehlmarshmallow.oes.features.questionset.dto;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.QuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import com.github.ryehlmarshmallow.oes.features.question.validation.ValidQuestion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

@ValidQuestion
public record QuestionRequest(
    @NotBlank String prompt,
    @NotNull QuestionType type,
    @NotNull BigDecimal points,
    @NotNull @Valid QuestionContent content,
    @NotNull Rubric rubric
) {
}
