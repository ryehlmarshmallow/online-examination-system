package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.MultipleChoiceQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceWeightedRubric;
import org.jspecify.annotations.NonNull;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@GraderFor(
    questionTypes = {
        QuestionType.MULTIPLE_CHOICE
    },
    graderType = GraderType.WEIGHTED
)
public class WeightedMultipleChoiceGrader extends TypedGrader<MultipleChoiceWeightedRubric, MultipleChoiceQuestionResponseData> {

    public WeightedMultipleChoiceGrader() {
        super(MultipleChoiceWeightedRubric.class, MultipleChoiceQuestionResponseData.class);
    }

    @Override
    protected GradingResult doGrade(
        Question question,
        @NonNull MultipleChoiceWeightedRubric rubric,
        @NonNull MultipleChoiceQuestionResponseData responseData
    ) {
        Map<Integer, BigDecimal> weights = rubric.getOptionWeights() == null ? Map.of() : rubric.getOptionWeights();
        Set<Integer> selected = toSet(responseData.getSelectedOptionIds());

        BigDecimal score = selected.stream()
            .map(optionId -> weights.getOrDefault(optionId, BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (!rubric.isAllowNegativeWeights()) {
            score = score.max(BigDecimal.ZERO);
        }

        BigDecimal maxPoints = safeMaxPoints(question);
        if (score.compareTo(maxPoints) > 0) {
            score = maxPoints;
        }

        return GradingResult.graded(score);
    }

    private static Set<Integer> toSet(List<Integer> optionIds) {
        return optionIds == null ? Set.of() : new LinkedHashSet<>(optionIds);
    }

    private static BigDecimal safeMaxPoints(Question question) {
        return question.getMaxPoints() == null ? BigDecimal.ZERO : question.getMaxPoints();
    }
}

