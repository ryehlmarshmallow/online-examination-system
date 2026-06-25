package com.github.ryehlmarshmallow.oes.features.question.entity.rubric;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GradingRegistry;
import com.github.ryehlmarshmallow.oes.features.grading.core.ManualGrader;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.ManualRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceCorrectOptionsRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceWeightedRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.SingleChoiceDichotomousRubric;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.module.SimpleModule;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

class RubricDeserializerTest {

    private static GradingRegistry registry() {
        return new GradingRegistry(
            List.of(new ManualGrader()),
            Set.of(
                ManualRubric.class,
                MultipleChoiceCorrectOptionsRubric.class,
                MultipleChoiceWeightedRubric.class,
                SingleChoiceDichotomousRubric.class
            )
        );
    }

    private static ObjectMapper mapper() {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(Rubric.class, new RubricDeserializer(registry()));
        return JsonMapper.builder().addModule(module).build();
    }

    @Test
    void shouldDeserializeSingleChoiceDichotomousRubric() {
        String json = """
            {
              "questionType": "SINGLE_CHOICE",
              "graderType": "DICHOTOMOUS",
              "correctOptionId": 1
            }
            """;

        Rubric rubric = mapper().readValue(json, Rubric.class);

        assertInstanceOf(SingleChoiceDichotomousRubric.class, rubric);
        assertEquals(QuestionType.SINGLE_CHOICE, rubric.getQuestionType());
        assertEquals(GraderType.DICHOTOMOUS, rubric.getGraderType());
        assertEquals(1, ((SingleChoiceDichotomousRubric) rubric).getCorrectOptionId());
    }

    @Test
    void shouldDeserializeManualRubricUsingQuestionTypeAndGraderType() {
        String json = """
            {
              "questionType": "ESSAY",
              "graderType": "MANUAL"
            }
            """;

        Rubric rubric = mapper().readValue(json, Rubric.class);

        assertInstanceOf(ManualRubric.class, rubric);
        assertEquals(QuestionType.ESSAY, rubric.getQuestionType());
        assertEquals(GraderType.MANUAL, rubric.getGraderType());
    }

    @Test
    void shouldDeserializeWeightedRubricForMultipleChoice() {
        String json = """
            {
              "questionType": "MULTIPLE_CHOICE",
              "graderType": "WEIGHTED",
              "optionWeights": {},
              "allowNegativeWeights": false
            }
            """;

        Rubric rubric = mapper().readValue(json, Rubric.class);

        assertInstanceOf(MultipleChoiceWeightedRubric.class, rubric);
        assertEquals(QuestionType.MULTIPLE_CHOICE, rubric.getQuestionType());
        assertEquals(GraderType.WEIGHTED, rubric.getGraderType());
    }
}

