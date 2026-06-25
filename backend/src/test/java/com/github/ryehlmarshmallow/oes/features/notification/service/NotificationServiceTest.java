package com.github.ryehlmarshmallow.oes.features.notification.service;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.notification.dto.NotificationDto;
import com.github.ryehlmarshmallow.oes.features.notification.entity.Notification;
import com.github.ryehlmarshmallow.oes.features.notification.entity.NotificationType;
import com.github.ryehlmarshmallow.oes.features.notification.entity.UserNotificationSetting;
import com.github.ryehlmarshmallow.oes.features.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.task.TaskExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserNotificationSettingService settingsService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private TaskExecutor applicationTaskExecutor;

    @Captor
    private ArgumentCaptor<Notification> notificationCaptor;

    @Captor
    private ArgumentCaptor<SimpleMailMessage> mailMessageCaptor;

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(
            notificationRepository,
            settingsService,
            userRepository,
            mailSender,
            applicationTaskExecutor
        );
    }

    @Test
    void shouldGetNotifications() {
        UUID userId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 10);
        Notification notification = Notification.builder()
            .id(UUID.randomUUID())
            .title("Test Title")
            .message("Test Message")
            .type(NotificationType.EXAM_PUBLISHED)
            .isRead(false)
            .createdAt(Instant.now())
            .build();

        when(notificationRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, pageable))
            .thenReturn(new PageImpl<>(List.of(notification), pageable, 1));

        Page<NotificationDto> result = notificationService.getNotifications(userId, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Test Title", result.getContent().get(0).title());
    }

    @Test
    void shouldGetUnreadCount() {
        UUID userId = UUID.randomUUID();
        when(notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNull(userId)).thenReturn(5L);

        assertEquals(5L, notificationService.getUnreadCount(userId));
    }

    @Test
    void shouldMarkAllAsRead() {
        UUID userId = UUID.randomUUID();
        notificationService.markAllAsRead(userId);

        verify(notificationRepository).markAllAsRead(eq(userId), any(Instant.class));
    }

    @Test
    void shouldMarkAsReadReturnsTrueWhenUpdated() {
        UUID notificationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(notificationRepository.markAsRead(eq(notificationId), eq(userId), any(Instant.class)))
            .thenReturn(1);

        assertTrue(notificationService.markAsRead(notificationId, userId));
    }

    @Test
    void shouldMarkAsReadReturnsFalseWhenNotUpdated() {
        UUID notificationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(notificationRepository.markAsRead(eq(notificationId), eq(userId), any(Instant.class)))
            .thenReturn(0);

        assertFalse(notificationService.markAsRead(notificationId, userId));
    }

    @Test
    void shouldThrowExceptionWhenCreatingNotificationForNonExistentUser() {
        UUID recipientId = UUID.randomUUID();
        when(userRepository.findById(recipientId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
            notificationService.createNotification(recipientId, "Title", "Msg", NotificationType.EXAM_PUBLISHED, Map.of())
        );
    }

    @Test
    void shouldCreateNotificationAndNotSendEmailIfDisabled() {
        UUID recipientId = UUID.randomUUID();
        User user = User.builder().id(recipientId).email("test@example.com").build();
        UserNotificationSetting settings = UserNotificationSetting.builder()
            .emailExamPublished(false)
            .build();

        when(userRepository.findById(recipientId)).thenReturn(Optional.of(user));
        when(settingsService.getOrCreateSettings(recipientId)).thenReturn(settings);

        notificationService.createNotification(recipientId, "New Exam", "Exam msg", NotificationType.EXAM_PUBLISHED, Map.of());

        verify(notificationRepository).save(notificationCaptor.capture());
        Notification saved = notificationCaptor.getValue();
        assertEquals("New Exam", saved.getTitle());
        assertEquals("Exam msg", saved.getMessage());
        assertEquals(user, saved.getUser());

        verifyNoInteractions(applicationTaskExecutor);
    }

    @Test
    void shouldCreateNotificationAndSendEmailIfEnabled() {
        UUID recipientId = UUID.randomUUID();
        User user = User.builder().id(recipientId).email("test@example.com").build();
        UserNotificationSetting settings = UserNotificationSetting.builder()
            .emailExamPublished(true)
            .build();

        when(userRepository.findById(recipientId)).thenReturn(Optional.of(user));
        when(settingsService.getOrCreateSettings(recipientId)).thenReturn(settings);

        // Execute task immediately when task executor is called
        doAnswer(invocation -> {
            Runnable runnable = invocation.getArgument(0);
            runnable.run();
            return null;
        }).when(applicationTaskExecutor).execute(any(Runnable.class));

        notificationService.createNotification(recipientId, "New Exam", "Exam msg", NotificationType.EXAM_PUBLISHED, Map.of());

        verify(notificationRepository).save(any(Notification.class));
        verify(applicationTaskExecutor).execute(any(Runnable.class));
        verify(mailSender).send(mailMessageCaptor.capture());

        SimpleMailMessage mailMessage = mailMessageCaptor.getValue();
        assertEquals("test@example.com", mailMessage.getTo()[0]);
        assertEquals("New Exam", mailMessage.getSubject());
        assertEquals("Exam msg", mailMessage.getText());
    }

    @Test
    void shouldDeleteNotificationReturnsTrueWhenUpdated() {
        UUID notificationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(notificationRepository.deleteNotification(eq(notificationId), eq(userId), any(Instant.class)))
            .thenReturn(1);

        assertTrue(notificationService.deleteNotification(notificationId, userId));
    }

    @Test
    void shouldDeleteNotificationReturnsFalseWhenNotUpdated() {
        UUID notificationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        when(notificationRepository.deleteNotification(eq(notificationId), eq(userId), any(Instant.class)))
            .thenReturn(0);

        assertFalse(notificationService.deleteNotification(notificationId, userId));
    }

    @Test
    void shouldDeleteAllNotifications() {
        UUID userId = UUID.randomUUID();
        notificationService.deleteAllNotifications(userId);

        verify(notificationRepository).deleteAllNotifications(eq(userId), any(Instant.class));
    }

    @Test
    void shouldDeleteAllReadNotifications() {
        UUID userId = UUID.randomUUID();
        notificationService.deleteAllReadNotifications(userId);

        verify(notificationRepository).deleteAllReadNotifications(eq(userId), any(Instant.class));
    }

    @Test
    void shouldCleanUpOldDeletedNotifications() {
        notificationService.cleanUpOldDeletedNotifications();

        verify(notificationRepository).deleteByDeletedAtBefore(any(Instant.class));
    }
}
