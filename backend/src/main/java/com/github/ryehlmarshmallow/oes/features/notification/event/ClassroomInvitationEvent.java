package com.github.ryehlmarshmallow.oes.features.notification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ClassroomInvitationEvent extends ApplicationEvent {
    private final UUID inviteId;
    private final UUID classroomId;
    private final UUID targetUserId;
    private final String inviterName;
    private final String classroomName;

    public ClassroomInvitationEvent(
        Object source,
        UUID inviteId,
        UUID classroomId,
        UUID targetUserId,
        String inviterName,
        String classroomName
    ) {
        super(source);
        this.inviteId = inviteId;
        this.classroomId = classroomId;
        this.targetUserId = targetUserId;
        this.inviterName = inviterName;
        this.classroomName = classroomName;
    }
}
