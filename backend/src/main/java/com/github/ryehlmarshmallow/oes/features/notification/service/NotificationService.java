package com.github.ryehlmarshmallow.oes.features.notification.service;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.notification.dto.NotificationDto;
import com.github.ryehlmarshmallow.oes.features.notification.entity.Notification;
import com.github.ryehlmarshmallow.oes.features.notification.entity.NotificationType;
import com.github.ryehlmarshmallow.oes.features.notification.entity.UserNotificationSetting;
import com.github.ryehlmarshmallow.oes.features.notification.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserNotificationSettingService settingsService;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final TaskExecutor applicationTaskExecutor;

    public NotificationService(
        NotificationRepository notificationRepository,
        UserNotificationSettingService settingsService,
        UserRepository userRepository,
        JavaMailSender mailSender,
        @Qualifier("applicationTaskExecutor") TaskExecutor applicationTaskExecutor
    ) {
        this.notificationRepository = notificationRepository;
        this.settingsService = settingsService;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.applicationTaskExecutor = applicationTaskExecutor;
    }

    @Transactional(readOnly = true)
    public Page<NotificationDto> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable)
            .map(NotificationDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNull(userId);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsRead(userId, Instant.now());
    }

    @Transactional
    public boolean markAsRead(UUID notificationId, UUID userId) {
        return notificationRepository.markAsRead(notificationId, userId, Instant.now()) > 0;
    }

    @Transactional
    public boolean deleteNotification(UUID notificationId, UUID userId) {
        return notificationRepository.deleteNotification(notificationId, userId, Instant.now()) > 0;
    }

    @Transactional
    public void deleteAllNotifications(UUID userId) {
        notificationRepository.deleteAllNotifications(userId, Instant.now());
    }

    @Transactional
    public void deleteAllReadNotifications(UUID userId) {
        notificationRepository.deleteAllReadNotifications(userId, Instant.now());
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanUpOldDeletedNotifications() {
        Instant threshold = Instant.now().minus(30, ChronoUnit.DAYS);
        notificationRepository.deleteByDeletedAtBefore(threshold);
        log.info("Cleaned up notifications soft-deleted before {}", threshold);
    }

    @Transactional
    public void createNotification(UUID recipientId, String title, String message, NotificationType type, Map<String, Object> metadata) {
        User user = userRepository.findById(recipientId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + recipientId));

        // 1. Persist the in-app notification
        Notification notification = Notification.builder()
            .user(user)
            .title(title)
            .message(message)
            .type(type)
            .metadata(metadata)
            .isRead(false)
            .build();
        notificationRepository.save(notification);

        // 2. Check settings and send email asynchronously if enabled
        UserNotificationSetting settings = settingsService.getOrCreateSettings(recipientId);
        boolean shouldSendEmail = type.isEmailEnabled(settings);

        if (shouldSendEmail && user.getEmail() != null) {
            String recipientEmail = user.getEmail();
            applicationTaskExecutor.execute(() -> {
                try {
                    SimpleMailMessage mailMessage = new SimpleMailMessage();
                    mailMessage.setTo(recipientEmail);
                    mailMessage.setSubject(title);
                    mailMessage.setText(message);
                    mailSender.send(mailMessage);
                    log.info("Notification email sent to: {}", recipientEmail);
                } catch (MailException ex) {
                    log.error("Failed to send notification email to: {}", recipientEmail, ex);
                }
            });
        }
    }
}
