package com.github.ryehlmarshmallow.oes.features.identity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "middle_name")
    private String middleName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false)
    private UserRole role = UserRole.USER;

    @Builder.Default
    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled = false;

    @Builder.Default
    @Column(name = "is_locked", nullable = false)
    private boolean isLocked = false;
}
