package com.github.ryehlmarshmallow.oes.features.question.validation;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.MultipleChoiceQuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceCorrectOptionsRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.MultipleChoiceWeightedRubric;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionRequest;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class MultipleChoiceQuestionTypeValidator implements QuestionTypeValidator {

    @Override
    public boolean supports(QuestionType type) {
        return type == QuestionType.MULTIPLE_CHOICE;
    }

    @Override
    public boolean validate(QuestionRequest value, ConstraintValidatorContext context) {
        if (!(value.content() instanceof MultipleChoiceQuestionContent content)) {
            return true;
        }

        if (value.rubric() instanceof MultipleChoiceCorrectOptionsRubric rubric) {
            List<Integer> correctIds = rubric.getCorrectOptionIds();
            if (correctIds == null) {
                addViolation(context, "correctOptionIds must not be null", "rubric", "correctOptionIds");
                return false;
            }

            // Check for duplicates
            Set<Integer> uniqueIds = new HashSet<>(correctIds);
            if (uniqueIds.size() != correctIds.size()) {
                addViolation(context, "correctOptionIds must not contain duplicates", "rubric", "correctOptionIds");
                return false;
            }

            // Check if all exist in options
            Set<Integer> optionIds = new HashSet<>(content.getOptions().stream()
                .map(MultipleChoiceQuestionContent.Option::getId)
                .toList());

            if (!optionIds.containsAll(correctIds)) {
                addViolation(context, "All correctOptionIds must match existing options", "rubric", "correctOptionIds");
                return false;
            }
        } else if (value.rubric() instanceof MultipleChoiceWeightedRubric rubric) {
            Map<Integer, BigDecimal> weights = rubric.getOptionWeights();
            if (weights != null) {
                Set<Integer> optionIds = new HashSet<>(content.getOptions().stream()
                    .map(MultipleChoiceQuestionContent.Option::getId)
                    .toList());

                for (Integer id : weights.keySet()) {
                    if (!optionIds.contains(id)) {
                        addViolation(context, "Option weight key '" + id + "' does not match any existing option", "rubric", "optionWeights");
                        return false;
                    }
                }
            }
        }

        return true;
    }
}
