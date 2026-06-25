package com.github.ryehlmarshmallow.oes.features.question.entity.content;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SingleChoiceQuestionContent implements QuestionContent {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotEmpty
    @Valid
    private List<Option> options;

    @Override
    public QuestionType getType() {
        return QuestionType.SINGLE_CHOICE;
    }

    @Override
    public void verifyStructuralConsistency(QuestionContent incoming) {
        SingleChoiceQuestionContent other = requireSameType(incoming);

        if (this.options == null || other.options == null) {
            if (this.options != other.options) {
                throw new IllegalArgumentException("Options list structure mismatch");
            }
            return;
        }

        if (this.options.size() != other.options.size()) {
            throw new IllegalArgumentException("Cannot add or remove options after attempts have started");
        }

        var thisIds = this.options.stream().map(Option::getId).toList();
        var otherIds = other.options.stream().map(Option::getId).toList();

        if (!thisIds.equals(otherIds)) {
            throw new IllegalArgumentException("Option IDs must match and maintain order after attempts have started");
        }
    }

    @Override
    public QuestionContent deepCopy() {
        List<Option> copiedOptions = options == null
            ? List.of()
            : options.stream()
            .map(option -> Option.builder()
                .id(option.getId())
                .text(option.getText())
                .build())
            .toList();

        return SingleChoiceQuestionContent.builder()
            .options(copiedOptions)
            .build();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Option implements Serializable {

        @Serial
        private static final long serialVersionUID = 1L;

        private Integer id;
        @NotBlank
        private String text;
    }
}
