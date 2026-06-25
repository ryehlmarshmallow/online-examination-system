package com.github.ryehlmarshmallow.oes.features.classroom.entity;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "classroom_invite_links",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_classroom_invite_links_token", columnNames = "token")
    },
    indexes = {
        @Index(name = "idx_classroom_invite_links_classroom", columnList = "classroom_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomInviteLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false, updatable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false, updatable = false)
    private User createdBy;

    @Column(name = "token", nullable = false, updatable = false, length = 8)
    private String token;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "max_uses")
    private Integer maxUses;

    @Builder.Default
    @Column(name = "use_count", nullable = false)
    private int useCount = 0;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by")
    private User revokedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}

