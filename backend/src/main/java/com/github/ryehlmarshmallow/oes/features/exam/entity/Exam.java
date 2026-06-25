package com.github.ryehlmarshmallow.oes.features.exam.entity;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.exam.group.entity.ExamGroup;
import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false, updatable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private ExamGroup group;

    @Enumerated(EnumType.STRING)
    @Column(name = "student_grade_visibility_mode", nullable = false)
    @Builder.Default
    private StudentGradeVisibilityMode studentGradeVisibilityMode = StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT;

    @Enumerated(EnumType.STRING)
    @Column(name = "student_answer_visibility_mode", nullable = false)
    @Builder.Default
    private StudentAnswerVisibilityMode studentAnswerVisibilityMode = StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT;

    @Column(name = "order_index", nullable = false)
    private Double orderIndex;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "duration")
    private Duration duration;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private Set<ExamQuestionGroup> examQuestionGroups = new LinkedHashSet<>();
}