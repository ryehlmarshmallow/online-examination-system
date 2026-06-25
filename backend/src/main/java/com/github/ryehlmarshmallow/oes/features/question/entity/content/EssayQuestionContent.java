package com.github.ryehlmarshmallow.oes.features.question.entity.content;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import lombok.*;

import java.io.Serial;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EssayQuestionContent implements QuestionContent {

    @Serial
    private static final long serialVersionUID = 1L;

    private Integer minWords;
    private Integer maxWords;
    private Integer maxCharacters;

    @Override
    public QuestionType getType() {
        return QuestionType.ESSAY;
    }

    @Override
    public QuestionContent deepCopy() {
        return EssayQuestionContent.builder()
            .minWords(minWords)
            .maxWords(maxWords)
            .maxCharacters(maxCharacters)
            .build();
    }
}
