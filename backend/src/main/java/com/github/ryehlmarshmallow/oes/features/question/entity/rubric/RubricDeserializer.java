package com.github.ryehlmarshmallow.oes.features.question.entity.rubric;

import com.github.ryehlmarshmallow.oes.features.grading.exception.UnsupportedGradingException;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GradingRegistry;
import lombok.RequiredArgsConstructor;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ValueDeserializer;

import java.util.Arrays;

@RequiredArgsConstructor
public class RubricDeserializer extends ValueDeserializer<Rubric> {

    private final GradingRegistry gradingRegistry;

    @Override
    public Rubric deserialize(JsonParser p, DeserializationContext ctxt) {
        JsonNode node = p.readValueAsTree();

        QuestionType questionType = parseRequiredEnum(node, "questionType", QuestionType.class, ctxt);
        GraderType graderType = parseRequiredEnum(node, "graderType", GraderType.class, ctxt);

        Class<? extends Rubric> rubricClass;
        try {
            rubricClass = gradingRegistry.resolveRubricClass(questionType, graderType);
        } catch (UnsupportedGradingException ex) {
            return ctxt.reportInputMismatch(Rubric.class, ex.getMessage());
        }

        return ctxt.readTreeAsValue(node, rubricClass);
    }

    private static <E extends Enum<E>> E parseRequiredEnum(
        JsonNode node,
        String field,
        Class<E> enumType,
        DeserializationContext ctxt
    ) {
        JsonNode enumNode = node.get(field);
        if (enumNode == null || enumNode.isNull()) {
            return ctxt.reportInputMismatch(Rubric.class, "Missing required field: " + field);
        }
        if (!enumNode.isString()) {
            return ctxt.reportInputMismatch(Rubric.class, "Field " + field + " must be a string");
        }

        try {
            return Enum.valueOf(enumType, enumNode.asString());
        } catch (IllegalArgumentException _) {
            return ctxt.reportInputMismatch(
                Rubric.class,
                "Invalid %s: %s. Supported values: %s",
                field,
                enumNode.asString(),
                Arrays.toString(enumType.getEnumConstants())
            );
        }
    }
}
