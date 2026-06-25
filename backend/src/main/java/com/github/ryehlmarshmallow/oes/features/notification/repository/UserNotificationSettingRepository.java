package com.github.ryehlmarshmallow.oes.features.notification.repository;

import com.github.ryehlmarshmallow.oes.features.notification.entity.UserNotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserNotificationSettingRepository extends JpaRepository<UserNotificationSetting, UUID> {
}
