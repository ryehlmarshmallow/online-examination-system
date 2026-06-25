package com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl;

import com.fasterxml.jackson.annotation.JsonCreator;
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
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

@Getter
@Setter
@RubricFor(
    questionTypes = {
        QuestionType.MULTIPLE_CHOICE
    },
    graderTypes = {
        GraderType.WEIGHTED
    }
)
public class MultipleChoiceWeightedRubric extends BaseRubric {

    @Serial
    private static final long serialVersionUID = 1L;

    private Map<Integer, BigDecimal> optionWeights;
    private boolean allowNegativeWeights;

    public MultipleChoiceWeightedRubric(QuestionType questionType, Map<Integer, BigDecimal> optionWeights, boolean allowNegativeWeights) {
        super(questionType, GraderType.WEIGHTED);
        this.optionWeights = optionWeights;
        this.allowNegativeWeights = allowNegativeWeights;
    }

    @JsonCreator
    public MultipleChoiceWeightedRubric(
        @JsonProperty("optionWeights") @Nullable Map<Integer, BigDecimal> optionWeights,
        @JsonProperty("allowNegativeWeights") boolean allowNegativeWeights,
        @JsonProperty("questionType") @Nullable QuestionType questionType,
        @JsonProperty("graderType") @Nullable GraderType graderType
    ) {
        super(questionType, graderType);
        this.optionWeights = optionWeights;
        this.allowNegativeWeights = allowNegativeWeights;
    }

    @Override
    public Rubric deepCopy() {
        return new MultipleChoiceWeightedRubric(
            getQuestionType(),
            optionWeights == null ? new LinkedHashMap<>() : new LinkedHashMap<>(optionWeights),
            allowNegativeWeights
        );
    }
}
