package com.github.ryehlmarshmallow.oes.features.question.service;

import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionGroup;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.MultipleChoiceQuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceWeightedRubric;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class QuestionCloneServiceTest {

    @Test
    void shouldDeepCloneQuestionGroupWithoutSharedNestedReferences() {
        Integer optionAId = 1;
        Integer optionBId = 2;

        MultipleChoiceQuestionContent content = MultipleChoiceQuestionContent.builder()
            .options(List.of(
                MultipleChoiceQuestionContent.Option.builder().id(optionAId).text("A").build(),
                MultipleChoiceQuestionContent.Option.builder().id(optionBId).text("B").build()
            ))
            .build();

        MultipleChoiceWeightedRubric rubric = new MultipleChoiceWeightedRubric(
            QuestionType.MULTIPLE_CHOICE,
            Map.of(optionAId, new BigDecimal("1.0"), optionBId, new BigDecimal("0.0")),
            false
        );

        QuestionGroup source = QuestionGroup.builder()
            .prompt("Group prompt")
            .build();

        Question sourceQuestion = Question.builder()
            .group(source)
            .orderIndex(1)
            .type(QuestionType.MULTIPLE_CHOICE)
            .prompt("Pick one")
            .maxPoints(new BigDecimal("1.0"))
            .content(content)
            .rubric(rubric)
            .build();

        source.setQuestions(Set.of(sourceQuestion));

        QuestionGroup clone = source.deepCopy();

        assertNotSame(source, clone);
        assertEquals(source.getPrompt(), clone.getPrompt());
        assertEquals(1, clone.getQuestions().size());

        Question clonedQuestion = clone.getQuestions().iterator().next();
        assertNotSame(sourceQuestion, clonedQuestion);
        assertSame(clone, clonedQuestion.getGroup());
        assertEquals(sourceQuestion.getPrompt(), clonedQuestion.getPrompt());

        assertInstanceOf(MultipleChoiceQuestionContent.class, clonedQuestion.getContent());
        MultipleChoiceQuestionContent copiedContent = (MultipleChoiceQuestionContent) clonedQuestion.getContent();
        assertNotSame(content, copiedContent);
        assertNotSame(content.getOptions(), copiedContent.getOptions());

        assertInstanceOf(MultipleChoiceWeightedRubric.class, clonedQuestion.getRubric());
        MultipleChoiceWeightedRubric copiedRubric = (MultipleChoiceWeightedRubric) clonedQuestion.getRubric();
        assertNotSame(rubric, copiedRubric);
        assertNotSame(rubric.getOptionWeights(), copiedRubric.getOptionWeights());
        assertEquals(GraderType.WEIGHTED, copiedRubric.getGraderType());
    }
}

