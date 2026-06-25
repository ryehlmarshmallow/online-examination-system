package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.MultipleChoiceQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceCorrectOptionsRubric;
import org.jspecify.annotations.NonNull;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@GraderFor(
    questionTypes = {
        QuestionType.MULTIPLE_CHOICE
    },
    graderType = GraderType.HALVING
)
public class HalvingMultipleChoiceGrader extends TypedGrader<MultipleChoiceCorrectOptionsRubric, MultipleChoiceQuestionResponseData> {

    public HalvingMultipleChoiceGrader() {
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

        int mistakes = countMistakes(correct, selected);
        BigDecimal score = safeMaxPoints(question);
        for (int i = 0; i < mistakes; i++) {
            score = score.divide(BigDecimal.valueOf(2L), MathContext.DECIMAL64);
        }

        return GradingResult.graded(score.max(BigDecimal.ZERO));
    }

    private static int countMistakes(Set<Integer> correct, Set<Integer> selected) {
        int incorrectSelections = (int) selected.stream().filter(optionId -> !correct.contains(optionId)).count();
        int missedCorrect = (int) correct.stream().filter(optionId -> !selected.contains(optionId)).count();
        return incorrectSelections + missedCorrect;
    }

    private static Set<Integer> toSet(List<Integer> optionIds) {
        return optionIds == null ? Set.of() : new LinkedHashSet<>(optionIds);
    }

    private static BigDecimal safeMaxPoints(Question question) {
        return question.getMaxPoints() == null ? BigDecimal.ZERO : question.getMaxPoints();
    }
}

