package com.github.ryehlmarshmallow.oes.features.exam.attempt.entity;

import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "question_responses", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"attempt_id", "question_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "question_response_data", columnDefinition = "jsonb", nullable = false)
    private QuestionResponseData data;

    @Column(precision = 7, scale = 3)
    private BigDecimal score;

    @Column(name = "is_graded", nullable = false)
    @Builder.Default
    private boolean isGraded = false;

    @Column(name = "is_overridden", nullable = false)
    @Builder.Default
    private boolean isOverridden = false;

    @Column(name = "last_sequence_number")
    private Long lastSequenceNumber;
}
