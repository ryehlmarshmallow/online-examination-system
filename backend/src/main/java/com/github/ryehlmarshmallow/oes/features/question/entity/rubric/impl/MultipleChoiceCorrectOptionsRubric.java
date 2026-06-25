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
import java.util.List;

@RubricFor(
    questionTypes = {
        QuestionType.MULTIPLE_CHOICE
    },
    graderTypes = {
        GraderType.DICHOTOMOUS,
        GraderType.HALVING
    }
)
@Getter
@Setter
public class MultipleChoiceCorrectOptionsRubric extends BaseRubric {

    @Serial
    private static final long serialVersionUID = 1L;

    private List<Integer> correctOptionIds;

    public MultipleChoiceCorrectOptionsRubric(QuestionType questionType, GraderType graderType, List<Integer> correctOptionIds) {
        super(questionType, graderType);
        this.correctOptionIds = correctOptionIds;
    }

    public MultipleChoiceCorrectOptionsRubric(
        @JsonProperty("correctOptionIds") @Nullable List<Integer> correctOptionIds,
        @JsonProperty("questionType") @Nullable QuestionType questionType,
        @JsonProperty("graderType") @Nullable GraderType graderType
    ) {
        super(questionType, graderType);
        this.correctOptionIds = correctOptionIds;
    }

    @Override
    public Rubric deepCopy() {
        return new MultipleChoiceCorrectOptionsRubric(getQuestionType(), getGraderType(), getCorrectOptionIds());
    }

    @Override
    public void verifyStructuralConsistency(Rubric incoming) {
        super.verifyStructuralConsistency(incoming);
        requireSameType(incoming);
    }
}
