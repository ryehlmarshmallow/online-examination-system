package com.github.ryehlmarshmallow.oes.features.exam.dto;

import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentGradeVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentAnswerVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.entity.ExamStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExamResponse(
    UUID id,
    String title,
    UUID classroomId,
    UUID groupId,
    int questionGroupCount,
    Double orderIndex,
    StudentGradeVisibilityMode studentGradeVisibilityMode,
    StudentAnswerVisibilityMode studentAnswerVisibilityMode,
    Instant startTime,
    Instant endTime,
    Long duration,
    Integer maxAttempts,
    ExamStatus status,
    List<ExamQuestionGroupResponse> questionGroups
) {
}

