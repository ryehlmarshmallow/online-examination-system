package com.github.ryehlmarshmallow.oes.features.questionset.entity;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionGroup;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "question_set_question_groups")
@Getter
@Setter
@NoArgsConstructor
public class QuestionSetQuestionGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_set_id", nullable = false)
    private QuestionSet questionSet;

    @OneToOne(fetch = FetchType.LAZY, optional = false, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "question_group_id", nullable = false)
    private QuestionGroup questionGroup;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    public QuestionSetQuestionGroup(QuestionSet questionSet, QuestionGroup questionGroup, Integer orderIndex) {
        this.questionSet = questionSet;
        this.questionGroup = questionGroup;
        this.orderIndex = orderIndex;
    }

    public QuestionSetQuestionGroup(QuestionSetQuestionGroup source, QuestionSet targetQuestionSet) {
        this(targetQuestionSet, source.getQuestionGroup().deepCopy(), source.orderIndex != null ? source.orderIndex : 0);
        this.id = null;
    }
}
