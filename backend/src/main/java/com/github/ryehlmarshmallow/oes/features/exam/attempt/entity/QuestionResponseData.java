package com.github.ryehlmarshmallow.oes.features.exam.attempt.entity;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.EssayQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.FileQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.MultipleChoiceQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.SingleChoiceQuestionResponseData;

import java.io.Serializable;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = SingleChoiceQuestionResponseData.class, name = "SINGLE_CHOICE"),
    @JsonSubTypes.Type(value = MultipleChoiceQuestionResponseData.class, name = "MULTIPLE_CHOICE"),
    @JsonSubTypes.Type(value = EssayQuestionResponseData.class, name = "ESSAY"),
    @JsonSubTypes.Type(value = FileQuestionResponseData.class, name = "FILE")
})
public interface QuestionResponseData extends Serializable {
}
