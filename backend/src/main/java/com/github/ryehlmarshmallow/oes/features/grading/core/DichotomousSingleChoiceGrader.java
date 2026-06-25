package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.SingleChoiceQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.SingleChoiceDichotomousRubric;
import org.jspecify.annotations.NonNull;

import java.math.BigDecimal;
import java.util.Objects;

@GraderFor(
    questionTypes = {
        QuestionType.SINGLE_CHOICE
    },
    graderType = GraderType.DICHOTOMOUS
)
public class DichotomousSingleChoiceGrader extends TypedGrader<SingleChoiceDichotomousRubric, SingleChoiceQuestionResponseData> {

    public DichotomousSingleChoiceGrader() {
        super(SingleChoiceDichotomousRubric.class, SingleChoiceQuestionResponseData.class);
    }

    @Override
    protected GradingResult doGrade(
        Question question,
        @NonNull SingleChoiceDichotomousRubric rubric,
        @NonNull SingleChoiceQuestionResponseData responseData
    ) {
        Integer selected = responseData.getSelectedOptionId();

        // For single choice, we expect the selected option to match the correct one.
        boolean isCorrect = selected != null &&
            Objects.equals(selected, rubric.getCorrectOptionId());

        BigDecimal score = isCorrect ? safeMaxPoints(question) : BigDecimal.ZERO;
        return GradingResult.graded(score);
    }

    private static BigDecimal safeMaxPoints(Question question) {
        return question.getMaxPoints() == null ? BigDecimal.ZERO : question.getMaxPoints();
    }
}
