package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;

import java.util.List;
import java.util.UUID;

public record AttemptAnswersResponse(
    UUID attemptId,
    ExamAttempt.Status status,
    boolean rubricVisible,
    boolean gradeVisible,
    List<AttemptQuestionAnswerResponse> answers,
    String rubricHiddenReason,
    String gradeHiddenReason
) {
}

