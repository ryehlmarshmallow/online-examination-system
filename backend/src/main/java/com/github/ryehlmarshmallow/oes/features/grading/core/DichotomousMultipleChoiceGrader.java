package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.MultipleChoiceQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceCorrectOptionsRubric;
import org.jspecify.annotations.NonNull;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@GraderFor(
    questionTypes = {
        QuestionType.MULTIPLE_CHOICE
    },
    graderType = GraderType.DICHOTOMOUS
)
public class DichotomousMultipleChoiceGrader extends TypedGrader<MultipleChoiceCorrectOptionsRubric, MultipleChoiceQuestionResponseData> {

    public DichotomousMultipleChoiceGrader() {
        super(MultipleChoiceCorrectOptionsRubric.class, MultipleChoiceQuestionResponseData.class);
    }

    @Override
    protected GradingResult doGrade(
        Question question,
        @NonNull MultipleChoiceCorrectOptionsRubric rubric,
        @NonNull MultipleChoiceQuestionResponseData responseData
    ) {
        Set<Integer> correct = toSet(rubric.getCorrectOptionIds());
        Set<Integer> selected = toSet(responseData.getSelectedOptionIds());
        BigDecimal score = selected.equals(correct) ? safeMaxPoints(question) : BigDecimal.ZERO;
        return GradingResult.graded(score);
    }

    private static Set<Integer> toSet(List<Integer> optionIds) {
        return optionIds == null ? Set.of() : new LinkedHashSet<>(optionIds);
    }

    private static BigDecimal safeMaxPoints(Question question) {
        return question.getMaxPoints() == null ? BigDecimal.ZERO : question.getMaxPoints();
    }
}

