package com.github.ryehlmarshmallow.oes.features.notification.service;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.notification.dto.UserNotificationSettingDto;
import com.github.ryehlmarshmallow.oes.features.notification.entity.UserNotificationSetting;
import com.github.ryehlmarshmallow.oes.features.notification.repository.UserNotificationSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserNotificationSettingServiceTest {

    @Mock
    private UserNotificationSettingRepository settingsRepository;

    @Mock
    private UserRepository userRepository;

    private UserNotificationSettingService settingsService;

    @BeforeEach
    void setUp() {
        settingsService = new UserNotificationSettingService(settingsRepository, userRepository);
    }

    @Test
    void shouldGetExistingSettings() {
        UUID userId = UUID.randomUUID();
        UserNotificationSetting settings = UserNotificationSetting.builder()
            .emailExamPublished(true)
            .build();

        when(settingsRepository.findById(userId)).thenReturn(Optional.of(settings));

        UserNotificationSetting result = settingsService.getOrCreateSettings(userId);

        assertNotNull(result);
        assertTrue(result.isEmailExamPublished());
        verify(userRepository, never()).findById(any());
        verify(settingsRepository, never()).save(any());
    }

    @Test
    void shouldCreateDefaultSettingsWhenNotFound() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        UserNotificationSetting settings = UserNotificationSetting.builder()
            .user(user)
            .emailExamPublished(false)
            .emailExamGraded(false)
            .emailClassroomInvite(false)
            .build();

        when(settingsRepository.findById(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(settingsRepository.save(any(UserNotificationSetting.class))).thenReturn(settings);

        UserNotificationSetting result = settingsService.getOrCreateSettings(userId);

        assertNotNull(result);
        assertFalse(result.isEmailExamPublished());
        assertFalse(result.isEmailExamGraded());
        assertFalse(result.isEmailClassroomInvite());
        verify(settingsRepository).save(any(UserNotificationSetting.class));
    }

    @Test
    void shouldThrowExceptionWhenCreatingSettingsForNonExistentUser() {
        UUID userId = UUID.randomUUID();
        when(settingsRepository.findById(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> settingsService.getOrCreateSettings(userId));
    }

    @Test
    void shouldUpdateSettings() {
        UUID userId = UUID.randomUUID();
        UserNotificationSetting settings = UserNotificationSetting.builder()
            .emailExamPublished(false)
            .emailExamGraded(false)
            .emailClassroomInvite(false)
            .build();

        when(settingsRepository.findById(userId)).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(UserNotificationSetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserNotificationSettingDto dto = new UserNotificationSettingDto(true, true, true);
        UserNotificationSettingDto result = settingsService.updateSettings(userId, dto);

        assertNotNull(result);
        assertTrue(result.emailExamPublished());
        assertTrue(result.emailExamGraded());
        assertTrue(result.emailClassroomInvite());
    }
}
