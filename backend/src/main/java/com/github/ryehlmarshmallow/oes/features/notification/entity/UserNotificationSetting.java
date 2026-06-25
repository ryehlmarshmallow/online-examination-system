package com.github.ryehlmarshmallow.oes.features.notification.entity;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "user_notification_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotificationSetting {

    @Id
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "email_exam_published", nullable = false)
    @Builder.Default
    private boolean emailExamPublished = false;

    @Column(name = "email_exam_graded", nullable = false)
    @Builder.Default
    private boolean emailExamGraded = false;

    @Column(name = "email_classroom_invite", nullable = false)
    @Builder.Default
    private boolean emailClassroomInvite = false;
}
