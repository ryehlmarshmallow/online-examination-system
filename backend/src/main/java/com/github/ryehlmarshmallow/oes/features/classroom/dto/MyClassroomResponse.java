package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;

import java.time.Instant;
import java.util.UUID;

public record MyClassroomResponse(
    UUID id,
    String name,
    String description,
    ClassroomRole role,
    boolean canManageExams,
    boolean canManageStudents,
    boolean canManageGrades,
    UUID groupId,
    Double orderIndex,
    Instant joinedAt,
    Instant createdAt
) {
}
