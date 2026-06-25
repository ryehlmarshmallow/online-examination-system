package com.github.ryehlmarshmallow.oes.features.notification.controller;

import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.common.security.ratelimit.RateLimit;
import com.github.ryehlmarshmallow.oes.features.notification.dto.NotificationDto;
import com.github.ryehlmarshmallow.oes.features.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getNotifications(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<NotificationDto> notifications = notificationService.getNotifications(userDetails.getUser().getId(), pageable);
        return ResponseEntity.ok(notifications);
    }

    @RateLimit(limit = 60, timeWindowSeconds = 60)
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        long count = notificationService.getUnreadCount(userDetails.getUser().getId());
        return ResponseEntity.ok(count);
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
        notificationService.markAllAsRead(userDetails.getUser().getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
        @PathVariable("id") UUID notificationId,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean success = notificationService.markAsRead(notificationId, userDetails.getUser().getId());
        if (success) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
        @PathVariable("id") UUID notificationId,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        boolean success = notificationService.deleteNotification(notificationId, userDetails.getUser().getId());
        if (success) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteNotifications(
        @RequestParam(name = "onlyRead", defaultValue = "false") boolean onlyRead,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (onlyRead) {
            notificationService.deleteAllReadNotifications(userDetails.getUser().getId());
        } else {
            notificationService.deleteAllNotifications(userDetails.getUser().getId());
        }
        return ResponseEntity.noContent().build();
    }
}
