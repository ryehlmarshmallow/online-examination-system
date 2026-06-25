package com.github.ryehlmarshmallow.oes.features.exam.dto;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.QuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;

import java.math.BigDecimal;
import java.util.UUID;

public record ExamQuestionResponse(
    UUID id,
    String prompt,
    QuestionType type,
    BigDecimal points,
    QuestionContent content,
    Rubric rubric
) {
}
