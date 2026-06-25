package com.github.ryehlmarshmallow.oes.features.grading.graders;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.MultipleChoiceQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.SingleChoiceQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.grading.core.GradingResult;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import com.github.ryehlmarshmallow.oes.features.grading.core.DichotomousMultipleChoiceGrader;
import com.github.ryehlmarshmallow.oes.features.grading.core.DichotomousSingleChoiceGrader;
import com.github.ryehlmarshmallow.oes.features.grading.core.HalvingMultipleChoiceGrader;
import com.github.ryehlmarshmallow.oes.features.grading.core.WeightedMultipleChoiceGrader;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceCorrectOptionsRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceWeightedRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.SingleChoiceDichotomousRubric;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MultipleChoiceGradersTest {

    @Test
    void dichotomousShouldAwardFullPointsOnlyOnExactMatch() {
        Integer a = 1;
        Integer b = 2;
        Question question = question(BigDecimal.TEN, new MultipleChoiceCorrectOptionsRubric(QuestionType.MULTIPLE_CHOICE, GraderType.DICHOTOMOUS, List.of(a, b)));

        GradingResult fullScore = new DichotomousMultipleChoiceGrader().grade(
            question,
            new MultipleChoiceQuestionResponseData(List.of(b, a))
        );
        GradingResult zeroScore = new DichotomousMultipleChoiceGrader().grade(
            question,
            new MultipleChoiceQuestionResponseData(List.of(a))
        );

        assertEquals(BigDecimal.TEN, fullScore.score());
        assertEquals(BigDecimal.ZERO, zeroScore.score());
        assertTrue(fullScore.isGraded());
    }

    @Test
    void dichotomousShouldAwardFullPointsOnlyOnExactMatchForSingleChoice() {
        Integer a = 1;
        Question question = singleChoiceQuestion(BigDecimal.TEN, new SingleChoiceDichotomousRubric(QuestionType.SINGLE_CHOICE, GraderType.DICHOTOMOUS, a));

        GradingResult fullScore = new DichotomousSingleChoiceGrader().grade(
            question,
            new SingleChoiceQuestionResponseData(a)
        );
        GradingResult zeroScore = new DichotomousSingleChoiceGrader().grade(
            question,
            new SingleChoiceQuestionResponseData(2)
        );

        assertEquals(BigDecimal.TEN, fullScore.score());
        assertEquals(BigDecimal.ZERO, zeroScore.score());
    }

    @Test
    void halvingShouldReduceScoreByHalfPerMistake() {
        Integer a = 1;
        Integer b = 2;
        Integer c = 3;
        Question question = question(BigDecimal.TEN, new MultipleChoiceCorrectOptionsRubric(QuestionType.MULTIPLE_CHOICE, GraderType.HALVING, List.of(a, b)));

        GradingResult gradingResult = new HalvingMultipleChoiceGrader().grade(
            question,
            new MultipleChoiceQuestionResponseData(List.of(a, c))
        );

        assertEquals(0, gradingResult.score().compareTo(new BigDecimal("2.5")));
        assertTrue(gradingResult.isGraded());
    }

    @Test
    void weightedShouldSumSelectedOptionWeightsAndClampAsConfigured() {
        Integer a = 1;
        Integer b = 2;
        Integer c = 3;

        MultipleChoiceWeightedRubric noNegativeRubric = new MultipleChoiceWeightedRubric(
            QuestionType.MULTIPLE_CHOICE,
            Map.of(a, new BigDecimal("7.00"), b, new BigDecimal("6.00"), c, new BigDecimal("-4.00")),
            false
        );
        Question question = question(BigDecimal.TEN, noNegativeRubric);

        GradingResult cappedScore = new WeightedMultipleChoiceGrader().grade(
            question,
            new MultipleChoiceQuestionResponseData(List.of(a, b))
        );

        GradingResult floorScore = new WeightedMultipleChoiceGrader().grade(
            question,
            new MultipleChoiceQuestionResponseData(List.of(c))
        );

        assertEquals(0, cappedScore.score().compareTo(BigDecimal.TEN));
        assertEquals(BigDecimal.ZERO, floorScore.score());
    }

    private static Question question(BigDecimal maxPoints, Rubric rubric) {
        return Question.builder()
            .type(QuestionType.MULTIPLE_CHOICE)
            .maxPoints(maxPoints)
            .rubric(rubric)
            .build();
    }

    private static Question singleChoiceQuestion(BigDecimal maxPoints, Rubric rubric) {
        return Question.builder()
            .type(QuestionType.SINGLE_CHOICE)
            .maxPoints(maxPoints)
            .rubric(rubric)
            .build();
    }
}
