package com.github.ryehlmarshmallow.oes.features.notification.dto;

import com.github.ryehlmarshmallow.oes.features.notification.entity.Notification;
import com.github.ryehlmarshmallow.oes.features.notification.entity.NotificationType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    String title,
    String message,
    NotificationType type,
    Map<String, Object> metadata,
    boolean isRead,
    Instant readAt,
    Instant createdAt
) {
    public static NotificationDto fromEntity(Notification entity) {
        return new NotificationDto(
            entity.getId(),
            entity.getTitle(),
            entity.getMessage(),
            entity.getType(),
            entity.getMetadata(),
            entity.isRead(),
            entity.getReadAt(),
            entity.getCreatedAt()
        );
    }
}
