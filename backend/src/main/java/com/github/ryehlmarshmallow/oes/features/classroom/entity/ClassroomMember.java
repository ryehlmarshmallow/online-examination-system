package com.github.ryehlmarshmallow.oes.features.classroom.entity;

import com.github.ryehlmarshmallow.oes.features.classroom.group.entity.ClassroomGroup;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "classroom_members",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_classroom_member_classroom_user", columnNames = {"classroom_id", "user_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassroomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false)
    private ClassroomRole role;

    @Builder.Default
    @Column(name = "can_manage_exams", nullable = false)
    private boolean canManageExams = false;

    @Builder.Default
    @Column(name = "can_manage_students", nullable = false)
    private boolean canManageStudents = false;

    @Builder.Default
    @Column(name = "can_manage_grades", nullable = false)
    private boolean canManageGrades = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private ClassroomGroup group;

    @Column(name = "joined_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "order_index", nullable = false)
    private Double orderIndex;

    @Column(name = "left_at")
    private Instant leftAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "removed_by")
    private User removedBy;
}
