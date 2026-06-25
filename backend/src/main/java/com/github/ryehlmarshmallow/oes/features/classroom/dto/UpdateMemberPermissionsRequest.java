package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberPermissionsRequest(
    @NotNull Boolean canManageExams,
    @NotNull Boolean canManageStudents,
    @NotNull Boolean canManageGrades,
    @NotNull ClassroomRole role
) {
}

