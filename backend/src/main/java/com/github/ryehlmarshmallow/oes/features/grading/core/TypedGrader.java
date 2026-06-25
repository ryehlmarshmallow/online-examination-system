package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;

import java.util.Objects;

@Getter
@RequiredArgsConstructor(access = AccessLevel.PROTECTED)
public abstract non-sealed class TypedGrader<R extends Rubric, D extends QuestionResponseData> implements Grader {

    private final Class<R> rubricType;
    private final Class<D> responseDataType;

    @Override
    public final GradingResult grade(Question question, QuestionResponseData responseData) {
        Objects.requireNonNull(question, "question cannot be null");

        Rubric rubric = Objects.requireNonNull(question.getRubric(), "rubric cannot be null");
        Objects.requireNonNull(responseData, "responseData cannot be null");

        R typedRubric = castOrThrow(rubric, rubricType);
        D typedResponseData = castOrThrow(responseData, responseDataType);

        return doGrade(question, typedRubric, typedResponseData);
    }

    private static <T> T castOrThrow(Object value, @NonNull Class<T> expectedType) {
        if (!expectedType.isInstance(value)) {
            throw new IllegalArgumentException(
                "Incompatible type: expected " + expectedType.getName() + " but got " + value.getClass().getName()
            );
        }
        return expectedType.cast(value);
    }

    protected abstract GradingResult doGrade(Question question, @NonNull R rubric, @NonNull D responseData);
}
