package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import java.util.List;
import java.util.UUID;

public record FileSubmissionResponse(
    UUID attemptId,
    UUID questionId,
    int uploadedCount,
    List<FileDetails> files
) {
}

