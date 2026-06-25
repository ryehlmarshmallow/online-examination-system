package com.github.ryehlmarshmallow.oes.features.grading.core;

import java.math.BigDecimal;

public record GradingResult(
    BigDecimal score,
    boolean isGraded
) {

    public static GradingResult ungraded() {
        return new GradingResult(BigDecimal.ZERO, false);
    }

    public static GradingResult graded(BigDecimal score) {
        return new GradingResult(score, true);
    }
}
