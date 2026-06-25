package com.github.ryehlmarshmallow.oes.features.question.entity;

import com.github.ryehlmarshmallow.oes.features.question.entity.content.QuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question implements DeepCopyable<Question> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_group_id", nullable = false)
    private QuestionGroup group;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuestionType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "max_points", nullable = false, precision = 7, scale = 3)
    private BigDecimal maxPoints;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private QuestionContent content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Rubric rubric;

    @Override
    public Question deepCopy() {
        return deepCopy(null);
    }

    public Question deepCopy(QuestionGroup targetGroup) {
        if (content == null) {
            throw new IllegalArgumentException("Question content cannot be null");
        }
        if (rubric == null) {
            throw new IllegalArgumentException("Question rubric cannot be null");
        }

        return Question.builder()
            .group(targetGroup)
            .orderIndex(orderIndex)
            .type(type)
            .prompt(prompt)
            .maxPoints(maxPoints)
            .content(content.deepCopy())
            .rubric(rubric.deepCopy())
            .build();
    }

    @PrePersist
    @PreUpdate
    private void validateStructuralConsistency() {
        if (content == null) {
            throw new IllegalStateException("Question content cannot be null");
        }
        if (rubric == null) {
            throw new IllegalStateException("Question rubric cannot be null");
        }
        if (type == null) {
            throw new IllegalStateException("Question type cannot be null");
        }

        if (content.getType() != type) {
            throw new IllegalArgumentException(
                "Content type " + content.getType() + " does not match question type " + type
            );
        }

        if (rubric.getQuestionType() != type) {
            throw new IllegalArgumentException(
                "Rubric question type " + rubric.getQuestionType() + " does not match question type " + type
            );
        }
    }
}
