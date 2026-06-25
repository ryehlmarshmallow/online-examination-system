package com.github.ryehlmarshmallow.oes.features.exam.attempt.entity;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomMember;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "exam_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_member_id", updatable = false)
    private ClassroomMember classroomMember;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.IN_PROGRESS;

    @Column(precision = 7, scale = 3)
    private BigDecimal score;

    @Column(name = "attempt_number", nullable = false)
    @Builder.Default
    private Integer attemptNumber = 1;

    @Column(name = "started_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant startedAt = Instant.now();

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<QuestionResponse> responses = new LinkedHashSet<>();

    public Instant calculateDeadline() {
        if (exam == null) {
            return null;
        }
        Duration duration = exam.getDuration();
        Instant endTime = exam.getEndTime();
        if (duration == null && endTime == null) {
            return null;
        }
        if (duration == null) {
            return endTime;
        }
        Instant relativeDeadline = startedAt.plus(duration);
        if (endTime == null) {
            return relativeDeadline;
        }
        return relativeDeadline.isBefore(endTime) ? relativeDeadline : endTime;
    }

    public enum Status {
        IN_PROGRESS,
        SUBMITTED,
        GRADED
    }
}
