package com.github.ryehlmarshmallow.oes.features.question.entity.content;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import lombok.*;

import java.io.Serial;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileQuestionContent implements QuestionContent {

    @Serial
    private static final long serialVersionUID = 1L;

    private List<String> allowedExtensions;
    private Integer maxFileSizeMegabytes;
    private Integer maxFileCount;

    @Override
    public QuestionType getType() {
        return QuestionType.FILE;
    }

    @Override
    public QuestionContent deepCopy() {
        return FileQuestionContent.builder()
            .allowedExtensions(allowedExtensions == null ? List.of() : new ArrayList<>(allowedExtensions))
            .maxFileSizeMegabytes(maxFileSizeMegabytes)
            .maxFileCount(maxFileCount)
            .build();
    }
}
