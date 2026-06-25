package com.github.ryehlmarshmallow.oes.features.exam.entity;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionGroup;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "exam_question_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamQuestionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @OneToOne(fetch = FetchType.LAZY, optional = false, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "question_group_id", nullable = false)
    private QuestionGroup questionGroup;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
}