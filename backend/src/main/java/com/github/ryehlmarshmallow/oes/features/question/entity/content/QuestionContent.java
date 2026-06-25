package com.github.ryehlmarshmallow.oes.features.question.entity.content;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.github.ryehlmarshmallow.oes.features.question.entity.DeepCopyable;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;

import java.io.Serializable;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = SingleChoiceQuestionContent.class, name = "SINGLE_CHOICE"),
    @JsonSubTypes.Type(value = MultipleChoiceQuestionContent.class, name = "MULTIPLE_CHOICE"),
    @JsonSubTypes.Type(value = EssayQuestionContent.class, name = "ESSAY"),
    @JsonSubTypes.Type(value = FileQuestionContent.class, name = "FILE")
})
public interface QuestionContent extends Serializable, DeepCopyable<QuestionContent> {
    QuestionType getType();

    QuestionContent deepCopy();

    default void verifyStructuralConsistency(QuestionContent incoming) {
    }

    @SuppressWarnings("unchecked")
    default <T extends QuestionContent> T requireSameType(QuestionContent other) {
        if (!this.getClass().isInstance(other)) {
            throw new IllegalArgumentException("Incompatible question content type: expected " +
                this.getClass().getSimpleName() + " but got " +
                (other == null ? "null" : other.getClass().getSimpleName()));
        }
        return (T) other;
    }
}
