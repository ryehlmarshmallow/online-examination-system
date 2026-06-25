package com.github.ryehlmarshmallow.oes.features.questionset.entity;

import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.BaseContent;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "question_sets")
@DiscriminatorValue("QUESTION_SET")
@Getter
@Setter
@NoArgsConstructor
public class QuestionSet extends BaseContent {

    @OneToMany(mappedBy = "questionSet", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private Set<QuestionSetQuestionGroup> questionSetQuestionGroups = new LinkedHashSet<>();

    public QuestionSet copy() {
        QuestionSet copy = new QuestionSet();
        int orderIndex = 0;
        for (QuestionSetQuestionGroup sourceGroup : this.questionSetQuestionGroups) {
            copy.getQuestionSetQuestionGroups().add(new QuestionSetQuestionGroup(copy, sourceGroup.getQuestionGroup().deepCopy(), orderIndex++));
        }
        return copy;
    }
}
