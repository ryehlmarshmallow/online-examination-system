package com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.BaseRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.RubricFor;
import lombok.Getter;
import lombok.Setter;
import org.jspecify.annotations.Nullable;

import java.io.Serial;

@RubricFor(
    questionTypes = {
        QuestionType.SINGLE_CHOICE
    },
    graderTypes = {
        GraderType.DICHOTOMOUS
    }
)
@Getter
@Setter
public class SingleChoiceDichotomousRubric extends BaseRubric {

    @Serial
    private static final long serialVersionUID = 1L;

    private Integer correctOptionId;

    public SingleChoiceDichotomousRubric(QuestionType questionType, GraderType graderType, Integer correctOptionId) {
        super(questionType, graderType);
        this.correctOptionId = correctOptionId;
    }

    public SingleChoiceDichotomousRubric(
        @JsonProperty("correctOptionId") @Nullable Integer correctOptionId,
        @JsonProperty("questionType") @Nullable QuestionType questionType,
        @JsonProperty("graderType") @Nullable GraderType graderType
    ) {
        super(questionType, graderType);
        this.correctOptionId = correctOptionId;
    }

    @Override
    public Rubric deepCopy() {
        return new SingleChoiceDichotomousRubric(getQuestionType(), getGraderType(), getCorrectOptionId());
    }

    @Override
    public void verifyStructuralConsistency(Rubric incoming) {
        super.verifyStructuralConsistency(incoming);
        requireSameType(incoming);
    }
}
