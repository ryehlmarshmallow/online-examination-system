package com.github.ryehlmarshmallow.oes.features.notification.repository;

import com.github.ryehlmarshmallow.oes.features.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    long countByUserIdAndIsReadFalseAndDeletedAtIsNull(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false AND n.deletedAt IS NULL")
    void markAllAsRead(@Param("userId") UUID userId, @Param("readAt") Instant readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id AND n.user.id = :userId AND n.isRead = false AND n.deletedAt IS NULL")
    int markAsRead(@Param("id") UUID id, @Param("userId") UUID userId, @Param("readAt") Instant readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.deletedAt = :deletedAt WHERE n.id = :id AND n.user.id = :userId AND n.deletedAt IS NULL")
    int deleteNotification(@Param("id") UUID id, @Param("userId") UUID userId, @Param("deletedAt") Instant deletedAt);

    @Modifying
    @Query("UPDATE Notification n SET n.deletedAt = :deletedAt WHERE n.user.id = :userId AND n.deletedAt IS NULL")
    void deleteAllNotifications(@Param("userId") UUID userId, @Param("deletedAt") Instant deletedAt);

    @Modifying
    @Query("UPDATE Notification n SET n.deletedAt = :deletedAt WHERE n.user.id = :userId AND n.isRead = true AND n.deletedAt IS NULL")
    void deleteAllReadNotifications(@Param("userId") UUID userId, @Param("deletedAt") Instant deletedAt);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.deletedAt < :threshold")
    void deleteByDeletedAtBefore(@Param("threshold") Instant threshold);
}
