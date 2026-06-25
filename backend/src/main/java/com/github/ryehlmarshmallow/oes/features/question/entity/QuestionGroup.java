package com.github.ryehlmarshmallow.oes.features.question.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "question_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionGroup implements DeepCopyable<QuestionGroup> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "is_group", nullable = false)
    @Builder.Default
    private boolean isGroup = false;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    @Builder.Default
    private Set<Question> questions = new LinkedHashSet<>();

    @Override
    public QuestionGroup deepCopy() {
        QuestionGroup clone = QuestionGroup.builder()
            .prompt(prompt)
            .isGroup(isGroup)
            .build();

        Set<Question> clonedQuestions = questions == null
            ? new LinkedHashSet<>()
            : questions.stream()
            .map(question -> question.deepCopy(clone))
            .collect(Collectors.toCollection(LinkedHashSet::new));

        clone.setQuestions(clonedQuestions);
        return clone;
    }
}