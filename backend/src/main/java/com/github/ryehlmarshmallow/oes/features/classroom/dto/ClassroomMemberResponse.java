package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;

import java.time.Instant;
import java.util.UUID;

public record ClassroomMemberResponse(
    UUID id,
    UUID userId,
    String username,
    String firstName,
    String middleName,
    String lastName,
    String email,
    ClassroomRole role,
    boolean canManageExams,
    boolean canManageStudents,
    boolean canManageGrades,
    Instant joinedAt,
    boolean active
) {
}

