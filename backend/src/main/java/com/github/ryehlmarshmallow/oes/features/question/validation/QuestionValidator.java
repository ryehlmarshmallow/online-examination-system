package com.github.ryehlmarshmallow.oes.features.question.validation;

import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;

import java.util.List;

@RequiredArgsConstructor
public class QuestionValidator implements ConstraintValidator<ValidQuestion, QuestionRequest> {

    private final List<QuestionTypeValidator> typeValidators;

    @Override
    public boolean isValid(QuestionRequest value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        context.disableDefaultConstraintViolation();

        return typeValidators.stream()
            .filter(validator -> validator.supports(value.type()))
            .findFirst()
            .map(validator -> validator.validate(value, context))
            .orElse(true);
    }
}
