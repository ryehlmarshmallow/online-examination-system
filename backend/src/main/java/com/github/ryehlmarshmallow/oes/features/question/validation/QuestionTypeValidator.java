package com.github.ryehlmarshmallow.oes.features.question.validation;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionRequest;
import jakarta.validation.ConstraintValidatorContext;

public interface QuestionTypeValidator {

    boolean supports(QuestionType type);

    boolean validate(QuestionRequest value, ConstraintValidatorContext context);

    default void addViolation(ConstraintValidatorContext context, String message, String... propertyPath) {
        ConstraintValidatorContext.ConstraintViolationBuilder builder = context.buildConstraintViolationWithTemplate(message);
        if (propertyPath.length > 0) {
            ConstraintValidatorContext.ConstraintViolationBuilder.NodeBuilderCustomizableContext nodeBuilder = builder.addPropertyNode(propertyPath[0]);
            for (int i = 1; i < propertyPath.length; i++) {
                nodeBuilder = nodeBuilder.addPropertyNode(propertyPath[i]);
            }
            nodeBuilder.addConstraintViolation();
        } else {
            builder.addConstraintViolation();
        }
    }
}
