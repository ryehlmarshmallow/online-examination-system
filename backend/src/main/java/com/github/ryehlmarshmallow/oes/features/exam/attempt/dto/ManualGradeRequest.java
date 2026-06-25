package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualGradeRequest {
    @NotNull
    private BigDecimal score;
}
