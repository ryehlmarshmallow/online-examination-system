package com.github.ryehlmarshmallow.oes.features.question.entity.rubric;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.DeepCopyable;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.ManualRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceCorrectOptionsRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceWeightedRubric;

import java.io.Serializable;

public sealed interface Rubric extends DeepCopyable<Rubric>, Serializable permits BaseRubric {
    QuestionType getQuestionType();

    GraderType getGraderType();

    default void verifyStructuralConsistency(Rubric incoming) {
        if (getQuestionType() != incoming.getQuestionType()) {
            throw new IllegalArgumentException("Cannot change question type after attempts have started");
        }
        if (getGraderType() != incoming.getGraderType()) {
            throw new IllegalArgumentException("Cannot change grader type after attempts have started");
        }
    }

    @SuppressWarnings("unchecked")
    default <T extends Rubric> T requireSameType(Rubric other) {
        if (other == null || !this.getClass().isInstance(other)) {
            throw new IllegalArgumentException("Incompatible rubric type: expected " +
                this.getClass().getSimpleName() + " but got " +
                (other == null ? "null" : other.getClass().getSimpleName()));
        }
        return (T) other;
    }
}
