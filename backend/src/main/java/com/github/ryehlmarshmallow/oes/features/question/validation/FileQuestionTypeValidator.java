package com.github.ryehlmarshmallow.oes.features.question.validation;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.FileQuestionContent;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionRequest;
import com.github.ryehlmarshmallow.oes.features.storage.config.StorageConfig;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class FileQuestionTypeValidator implements QuestionTypeValidator {

    private final StorageConfig storageConfig;

    @Override
    public boolean supports(QuestionType type) {
        return type == QuestionType.FILE;
    }

    @Override
    public boolean validate(QuestionRequest value, ConstraintValidatorContext context) {
        if (!(value.content() instanceof FileQuestionContent content)) {
            return true;
        }

        boolean valid = true;
        long systemMaxMb = storageConfig.getMaxFileSize().toMegabytes();
        if (content.getMaxFileSizeMegabytes() != null && content.getMaxFileSizeMegabytes() > systemMaxMb) {
            addViolation(context, "maxFileSizeMegabytes exceeds system limit of " + systemMaxMb + "MB", "content", "maxFileSizeMegabytes");
            valid = false;
        }

        if (content.getMaxFileCount() != null && content.getMaxFileCount() > storageConfig.getMaxFileCount()) {
            addViolation(context, "maxFileCount exceeds system limit of " + storageConfig.getMaxFileCount(), "content", "maxFileCount");
            valid = false;
        }

        if (content.getAllowedExtensions() != null) {
            Set<String> systemExtensions = new HashSet<>(storageConfig.getAllowedExtensions());
            for (String ext : content.getAllowedExtensions()) {
                if (!systemExtensions.contains(ext.toLowerCase())) {
                    addViolation(context, "Extension '" + ext + "' is not allowed by system configuration", "content", "allowedExtensions");
                    valid = false;
                }
            }
        }

        return valid;
    }
}
