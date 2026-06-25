package com.github.ryehlmarshmallow.oes.features.question.validation;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.SingleChoiceQuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.SingleChoiceDichotomousRubric;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionRequest;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.stereotype.Component;

@Component
public class SingleChoiceQuestionTypeValidator implements QuestionTypeValidator {

    @Override
    public boolean supports(QuestionType type) {
        return type == QuestionType.SINGLE_CHOICE;
    }

    @Override
    public boolean validate(QuestionRequest value, ConstraintValidatorContext context) {
        if (!(value.content() instanceof SingleChoiceQuestionContent content) ||
            !(value.rubric() instanceof SingleChoiceDichotomousRubric rubric)) {
            return true; // Let other validations handle type mismatch
        }

        Integer correctId = rubric.getCorrectOptionId();
        if (correctId == null) {
            addViolation(context, "correctOptionId must not be null", "rubric", "correctOptionId");
            return false;
        }

        boolean exists = content.getOptions().stream()
            .anyMatch(opt -> correctId.equals(opt.getId()));

        if (!exists) {
            addViolation(context, "correctOptionId must match one of the options", "rubric", "correctOptionId");
            return false;
        }

        return true;
    }
}
