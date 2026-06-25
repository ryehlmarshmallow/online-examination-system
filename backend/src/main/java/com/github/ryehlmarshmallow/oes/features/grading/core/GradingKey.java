package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;

public record GradingKey(
    QuestionType questionType,
    GraderType graderType
) {
}
