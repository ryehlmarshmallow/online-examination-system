package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomInviteStatus;

import java.time.Instant;
import java.util.UUID;

public record ClassroomInviteResponse(
    UUID id,
    UUID classroomId,
    String classroomName,
    String classroomDescription,
    UUID invitedByUserId,
    String invitedByUsername,
    String invitedByFirstName,
    String invitedByMiddleName,
    String invitedByLastName,
    UUID targetUserId,
    String targetUsername,
    String targetFirstName,
    String targetMiddleName,
    String targetLastName,
    String targetEmail,
    ClassroomInviteStatus status,
    boolean actionable,
    boolean alreadyMember,
    Instant createdAt,
    Instant expiresAt,
    Instant respondedAt
) {
}

