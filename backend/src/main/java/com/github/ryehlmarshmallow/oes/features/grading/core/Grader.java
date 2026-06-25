package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;

public sealed interface Grader permits TypedGrader {
    GradingResult grade(Question question, QuestionResponseData responseData);
}
