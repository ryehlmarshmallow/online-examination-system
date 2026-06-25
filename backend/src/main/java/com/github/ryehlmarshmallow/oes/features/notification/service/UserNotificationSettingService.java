package com.github.ryehlmarshmallow.oes.features.notification.service;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.notification.dto.UserNotificationSettingDto;
import com.github.ryehlmarshmallow.oes.features.notification.entity.UserNotificationSetting;
import com.github.ryehlmarshmallow.oes.features.notification.repository.UserNotificationSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserNotificationSettingService {

    private final UserNotificationSettingRepository settingsRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserNotificationSetting getOrCreateSettings(UUID userId) {
        return settingsRepository.findById(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
                UserNotificationSetting settings = UserNotificationSetting.builder()
                    .user(user)
                    .emailExamPublished(false)
                    .emailExamGraded(false)
                    .emailClassroomInvite(false)
                    .build();
                return settingsRepository.save(settings);
            });
    }

    @Transactional
    public UserNotificationSettingDto updateSettings(UUID userId, UserNotificationSettingDto dto) {
        UserNotificationSetting settings = getOrCreateSettings(userId);
        settings.setEmailExamPublished(dto.emailExamPublished());
        settings.setEmailExamGraded(dto.emailExamGraded());
        settings.setEmailClassroomInvite(dto.emailClassroomInvite());
        UserNotificationSetting saved = settingsRepository.save(settings);
        return UserNotificationSettingDto.fromEntity(saved);
    }
}
