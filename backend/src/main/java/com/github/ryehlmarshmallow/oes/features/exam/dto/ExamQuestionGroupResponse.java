package com.github.ryehlmarshmallow.oes.features.exam.dto;

import java.util.List;
import java.util.UUID;

public record ExamQuestionGroupResponse(
    UUID id,
    String prompt,
    boolean isGroup,
    List<ExamQuestionResponse> questions
) {
}
