package com.github.ryehlmarshmallow.oes.features.notification.controller;

import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.features.notification.dto.UserNotificationSettingDto;
import com.github.ryehlmarshmallow.oes.features.notification.entity.UserNotificationSetting;
import com.github.ryehlmarshmallow.oes.features.notification.service.UserNotificationSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications/settings")
@RequiredArgsConstructor
public class UserNotificationSettingController {

    private final UserNotificationSettingService settingsService;

    @GetMapping
    public ResponseEntity<UserNotificationSettingDto> getSettings(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserNotificationSetting settings = settingsService.getOrCreateSettings(userDetails.getUser().getId());
        return ResponseEntity.ok(UserNotificationSettingDto.fromEntity(settings));
    }

    @PutMapping
    public ResponseEntity<UserNotificationSettingDto> updateSettings(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody UserNotificationSettingDto dto
    ) {
        UserNotificationSettingDto updated = settingsService.updateSettings(userDetails.getUser().getId(), dto);
        return ResponseEntity.ok(updated);
    }
}
