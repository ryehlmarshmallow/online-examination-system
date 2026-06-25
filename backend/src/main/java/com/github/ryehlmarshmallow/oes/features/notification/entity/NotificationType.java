package com.github.ryehlmarshmallow.oes.features.notification.entity;

import java.util.function.Function;

public enum NotificationType {
    EXAM_PUBLISHED(UserNotificationSetting::isEmailExamPublished),
    EXAM_GRADED(UserNotificationSetting::isEmailExamGraded),
    CLASSROOM_INVITATION(UserNotificationSetting::isEmailClassroomInvite);

    private final Function<UserNotificationSetting, Boolean> resolver;

    NotificationType(Function<UserNotificationSetting, Boolean> resolver) {
        this.resolver = resolver;
    }

    public boolean isEmailEnabled(UserNotificationSetting settings) {
        return this.resolver.apply(settings);
    }
}
