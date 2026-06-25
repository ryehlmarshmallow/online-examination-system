package com.github.ryehlmarshmallow.oes.features.notification.dto;

import com.github.ryehlmarshmallow.oes.features.notification.entity.UserNotificationSetting;

public record UserNotificationSettingDto(
    boolean emailExamPublished,
    boolean emailExamGraded,
    boolean emailClassroomInvite
) {
    public static UserNotificationSettingDto fromEntity(UserNotificationSetting entity) {
        return new UserNotificationSettingDto(
            entity.isEmailExamPublished(),
            entity.isEmailExamGraded(),
            entity.isEmailClassroomInvite()
        );
    }
}
