package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;

import java.math.BigDecimal;
import java.util.UUID;

public record AttemptQuestionAnswerResponse(
    UUID questionId,
    QuestionType questionType,
    QuestionResponseData answer,
    Rubric rubric,
    BigDecimal score,
    boolean graded,
    boolean overridden
) {
}

