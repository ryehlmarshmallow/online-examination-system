package com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.BaseRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.RubricFor;
import org.jspecify.annotations.Nullable;

import java.io.Serial;

@RubricFor(
    allQuestionTypes = true,
    graderTypes = {
        GraderType.MANUAL
    }
)
public class ManualRubric extends BaseRubric {

    @Serial
    private static final long serialVersionUID = 1L;

    public ManualRubric(QuestionType questionType) {
        super(questionType, GraderType.MANUAL);
    }

    @JsonCreator
    public ManualRubric(
        @JsonProperty("questionType") QuestionType questionType,
        @JsonProperty("graderType") @Nullable GraderType graderType
    ) {
        super(questionType, graderType);
    }

    @Override
    public Rubric deepCopy() {
        return new ManualRubric(getQuestionType());
    }

}
