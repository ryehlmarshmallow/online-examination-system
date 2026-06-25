package com.github.ryehlmarshmallow.oes.features.question.validation;

import com.github.ryehlmarshmallow.oes.common.config.TextConfig;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.EssayQuestionContent;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionRequest;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EssayQuestionTypeValidator implements QuestionTypeValidator {

    private final TextConfig textConfig;

    @Override
    public boolean supports(QuestionType type) {
        return type == QuestionType.ESSAY;
    }

    @Override
    public boolean validate(QuestionRequest value, ConstraintValidatorContext context) {
        if (!(value.content() instanceof EssayQuestionContent content)) {
            return true;
        }

        boolean valid = true;
        if (content.getMinWords() != null && content.getMinWords() < 0) {
            addViolation(context, "minWords must be non-negative", "content", "minWords");
            valid = false;
        }

        if (content.getMinWords() != null && content.getMaxWords() != null &&
            content.getMinWords() > content.getMaxWords()) {
            addViolation(context, "minWords cannot be greater than maxWords", "content", "minWords");
            valid = false;
        }

        if (content.getMaxCharacters() != null && content.getMaxCharacters() > textConfig.getMaxCharacters()) {
            addViolation(context, "maxCharacters exceeds system limit of " + textConfig.getMaxCharacters(), "content", "maxCharacters");
            valid = false;
        }

        return valid;
    }
}
