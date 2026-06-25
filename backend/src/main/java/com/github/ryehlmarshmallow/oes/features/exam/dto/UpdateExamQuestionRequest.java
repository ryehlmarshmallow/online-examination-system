package com.github.ryehlmarshmallow.oes.features.exam.dto;

import com.github.ryehlmarshmallow.oes.features.question.entity.content.QuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateExamQuestionRequest(
    @NotBlank String prompt,
    @NotNull BigDecimal maxPoints,
    @NotNull QuestionContent content,
    @NotNull Rubric rubric,
    @NotNull Integer orderIndex
) {
}
