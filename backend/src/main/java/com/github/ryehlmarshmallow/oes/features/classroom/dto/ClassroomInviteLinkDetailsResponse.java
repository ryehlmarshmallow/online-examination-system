package com.github.ryehlmarshmallow.oes.features.classroom.dto;

import java.util.UUID;

public record ClassroomInviteLinkDetailsResponse(
    String token,
    UUID classroomId,
    String classroomName,
    String classroomDescription,
    String invitedByUsername,
    String invitedByFirstName,
    String invitedByLastName,
    boolean expired,
    boolean revoked,
    boolean capacityReached,
    boolean alreadyMember
) {
}
