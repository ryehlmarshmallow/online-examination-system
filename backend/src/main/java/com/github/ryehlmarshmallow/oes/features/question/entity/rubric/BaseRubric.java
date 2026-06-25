package com.github.ryehlmarshmallow.oes.features.question.entity.rubric;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;
import org.jspecify.annotations.Nullable;

import java.io.Serial;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public abstract non-sealed class BaseRubric implements Rubric {

    @Serial
    private static final long serialVersionUID = 1L;

    private static final Map<Class<? extends BaseRubric>, RubricMetadata> METADATA_CACHE = new ConcurrentHashMap<>();

    private final QuestionType questionType;
    private final GraderType graderType;

    @JsonCreator
    protected BaseRubric(
        @JsonProperty("questionType") @Nullable QuestionType questionType,
        @JsonProperty("graderType") @Nullable GraderType graderType
    ) {
        RubricMetadata metadata = metadataFor(getClass());
        this.questionType = metadata.resolveQuestionType(questionType);
        this.graderType = metadata.resolveGraderType(graderType);
        metadata.validateCombination(this.questionType, this.graderType);
    }

    @Override
    public final QuestionType getQuestionType() {
        return questionType;
    }

    @Override
    public final GraderType getGraderType() {
        return graderType;
    }


    public static RubricMetadata metadataFor(Class<?> clazz) {
        if (!BaseRubric.class.isAssignableFrom(clazz)) {
            throw new IllegalArgumentException(clazz.getName() + " must extend BaseRubric to use rubric metadata");
        }
        @SuppressWarnings("unchecked")
        Class<? extends BaseRubric> rubricClass = (Class<? extends BaseRubric>) clazz;
        return METADATA_CACHE.computeIfAbsent(rubricClass, RubricMetadata::from);
    }

    public record RubricMetadata(
        boolean allQuestionTypes,
        Set<QuestionType> supportedQuestionTypes,
        Set<GraderType> supportedGraderTypes,
        Set<Combination> validCombinations
    ) {
        public record Combination(QuestionType questionType, GraderType graderType) {
        }

        static RubricMetadata from(Class<? extends BaseRubric> clazz) {
            RubricFor[] annotations = clazz.getAnnotationsByType(RubricFor.class);
            if (annotations.length == 0) {
                throw new IllegalStateException(clazz.getName() + " must be annotated with @RubricFor");
            }

            Set<QuestionType> supportedQuestionTypes = EnumSet.noneOf(QuestionType.class);
            Set<GraderType> supportedGraderTypes = EnumSet.noneOf(GraderType.class);
            Set<Combination> validCombinations = new HashSet<>();
            boolean hasAllQuestionTypes = false;

            for (RubricFor annotation : annotations) {
                QuestionType[] qTypes = annotation.allQuestionTypes() ? QuestionType.values() : annotation.questionTypes();
                if (annotation.allQuestionTypes()) {
                    hasAllQuestionTypes = true;
                }

                supportedQuestionTypes.addAll(Arrays.asList(qTypes));
                supportedGraderTypes.addAll(Arrays.asList(annotation.graderTypes()));

                for (QuestionType q : qTypes) {
                    for (GraderType g : annotation.graderTypes()) {
                        validCombinations.add(new Combination(q, g));
                    }
                }
            }

            if (supportedQuestionTypes.isEmpty()) {
                throw new IllegalStateException(
                    clazz.getName() + " must declare at least one questionType or set allQuestionTypes=true in @RubricFor"
                );
            }

            if (supportedGraderTypes.isEmpty()) {
                throw new IllegalStateException(
                    clazz.getName() + " must declare at least one graderType in @RubricFor"
                );
            }

            return new RubricMetadata(
                hasAllQuestionTypes,
                supportedQuestionTypes,
                supportedGraderTypes,
                validCombinations
            );
        }

        public QuestionType resolveQuestionType(@Nullable QuestionType provided) {
            if (allQuestionTypes) {
                return Objects.requireNonNull(provided, "questionType must be provided when rubric supports all question types");
            }

            if (supportedQuestionTypes.size() == 1) {
                QuestionType only = supportedQuestionTypes.iterator().next();
                if (provided == null || provided == only) {
                    return only;
                }
                throw new IllegalArgumentException("Rubric is fixed to question type " + only + " but received " + provided);
            }

            if (provided == null) {
                throw new IllegalArgumentException("questionType must be provided when rubric supports multiple question types");
            }
            if (!supportedQuestionTypes.contains(provided)) {
                throw new IllegalArgumentException("Rubric does not support question type " + provided + ". Supported: " + supportedQuestionTypes);
            }
            return provided;
        }

        public GraderType resolveGraderType(@Nullable GraderType provided) {
            if (supportedGraderTypes.size() == 1) {
                GraderType only = supportedGraderTypes.iterator().next();
                if (provided == null || provided == only) {
                    return only;
                }
                throw new IllegalArgumentException("Rubric is fixed to grader type " + only + " but received " + provided);
            }

            if (provided == null) {
                throw new IllegalArgumentException("graderType must be provided when rubric supports multiple grader types");
            }
            if (!supportedGraderTypes.contains(provided)) {
                throw new IllegalArgumentException("Rubric does not support grader type " + provided + ". Supported: " + supportedGraderTypes);
            }
            return provided;
        }

        public void validateCombination(QuestionType q, GraderType g) {
            if (!validCombinations.contains(new Combination(q, g))) {
                throw new IllegalArgumentException("Unsupported combination of questionType=" + q + " and graderType=" + g);
            }
        }
    }
}
