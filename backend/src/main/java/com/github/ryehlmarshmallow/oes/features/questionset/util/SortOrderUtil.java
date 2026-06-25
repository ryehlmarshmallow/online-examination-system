package com.github.ryehlmarshmallow.oes.features.questionset.util;

import java.util.List;
import java.util.Optional;

public final class SortOrderUtil {

    public static final double DEFAULT_STRIDE = 1.0d;

    private SortOrderUtil() {
    }

    public static Optional<Double> tryAllocate(Double previousIndex, Double nextIndex) {
        if (previousIndex == null) {
            double candidate = beforeFirst(nextIndex);
            if (isFirstSafe(candidate, nextIndex)) {
                return Optional.of(candidate);
            }
        } else {
            double candidate = nextAfter(previousIndex, nextIndex);
            if (isSafe(previousIndex, candidate, nextIndex)) {
                return Optional.of(candidate);
            }
        }
        return Optional.empty();
    }

    public static double midpoint(double left, double right) {
        return left + (right - left) / 2.0d;
    }

    public static boolean isSafe(double left, double candidate, Double right) {
        if (right == null) {
            return true;
        }
        return Double.compare(candidate, left) > 0 && Double.compare(candidate, right) < 0;
    }

    public static boolean isFirstSafe(double candidate, Double first) {
        if (first == null) {
            return true;
        }
        return Double.compare(candidate, 0.0d) > 0 && Double.compare(candidate, first) < 0;
    }

    public static double nextAfter(double previous, Double next) {
        if (next == null) {
            return previous + DEFAULT_STRIDE;
        }
        return midpoint(previous, next);
    }

    public static double beforeFirst(Double first) {
        if (first == null) {
            return DEFAULT_STRIDE;
        }
        return first / 2.0d;
    }

    public static double nextTail(List<Double> siblings) {
        if (siblings.isEmpty()) {
            return DEFAULT_STRIDE;
        }
        return siblings.getLast() + DEFAULT_STRIDE;
    }
}

