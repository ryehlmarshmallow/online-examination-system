package com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import lombok.*;

import java.io.Serial;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SingleChoiceQuestionResponseData implements QuestionResponseData {
    @Serial
    private static final long serialVersionUID = 1L;

    private Integer selectedOptionId;
}
