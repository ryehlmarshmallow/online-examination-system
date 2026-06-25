package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.grading.exception.UnsupportedGradingException;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.BaseRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class GradingRegistry {

    private final Map<GradingKey, GradingHandlers> handlersByKey;

    public GradingRegistry(List<Grader> graderBeans, Set<Class<? extends BaseRubric>> rubricClasses) {
        Map<GradingKey, GradingHandlers> handlers = new HashMap<>();

        for (Map.Entry<GradingKey, Grader> entry : loadGraders(graderBeans).entrySet()) {
            GradingHandlers incoming = new GradingHandlers(entry.getValue(), null);
            handlers.compute(entry.getKey(), (key, existing) -> mergeHandlers(key, existing, incoming));
        }

        for (Map.Entry<GradingKey, Class<? extends Rubric>> entry : loadRubricClasses(rubricClasses).entrySet()) {
            GradingHandlers incoming = new GradingHandlers(null, entry.getValue());
            handlers.compute(entry.getKey(), (key, existing) -> mergeHandlers(key, existing, incoming));
        }

        this.handlersByKey = Map.copyOf(handlers);
    }

    public Grader resolveGrader(QuestionType questionType, GraderType graderType) {
        GradingHandlers handlers = getHandlers(questionType, graderType);
        if (handlers.grader() == null) {
            throw new UnsupportedGradingException("No grader found for key: " + new GradingKey(questionType, graderType));
        }
        return handlers.grader();
    }

    public Class<? extends Rubric> resolveRubricClass(QuestionType questionType, GraderType graderType) {
        GradingHandlers handlers = getHandlers(questionType, graderType);
        if (handlers.rubricClass() == null) {
            throw new UnsupportedGradingException("No rubric class found for key: " + new GradingKey(questionType, graderType));
        }
        return handlers.rubricClass();
    }

    public Map<QuestionType, Set<GraderType>> getSupportedGraderTypes() {
        Map<QuestionType, Set<GraderType>> supported = new EnumMap<>(QuestionType.class);
        for (Map.Entry<GradingKey, GradingHandlers> entry : handlersByKey.entrySet()) {
            if (entry.getValue().grader() == null) {
                continue;
            }
            GradingKey key = entry.getKey();
            supported.computeIfAbsent(key.questionType(), _ -> EnumSet.noneOf(GraderType.class))
                .add(key.graderType());
        }
        return supported;
    }

    public Map<QuestionType, Set<GraderType>> getSupportedRubrics() {
        Map<QuestionType, Set<GraderType>> supported = new EnumMap<>(QuestionType.class);
        for (Map.Entry<GradingKey, GradingHandlers> entry : handlersByKey.entrySet()) {
            if (entry.getValue().rubricClass() == null) {
                continue;
            }
            GradingKey key = entry.getKey();
            supported.computeIfAbsent(key.questionType(), _ -> EnumSet.noneOf(GraderType.class))
                .add(key.graderType());
        }
        return supported;
    }

    private GradingHandlers getHandlers(QuestionType questionType, GraderType graderType) {
        GradingKey key = new GradingKey(questionType, graderType);
        GradingHandlers handlers = handlersByKey.get(key);
        if (handlers == null) {
            throw new UnsupportedGradingException("No grading handlers found for key: " + key);
        }
        return handlers;
    }

    private Map<GradingKey, Grader> loadGraders(List<Grader> graderBeans) {
        Map<GradingKey, Grader> map = new HashMap<>();

        for (Grader grader : graderBeans) {
            GraderFor annotation = grader.getClass().getAnnotation(GraderFor.class);
            if (annotation == null) {
                throw new IllegalStateException("Grader class " + grader.getClass().getName() + " is missing @GraderFor annotation");
            }

            QuestionType[] questionTypes = annotation.allQuestionTypes()
                ? QuestionType.values()
                : annotation.questionTypes();

            if (questionTypes.length == 0) {
                throw new IllegalStateException(
                    "Grader class " + grader.getClass().getName() +
                        " must specify at least one question type in @GraderFor annotation"
                );
            }

            for (QuestionType questionType : questionTypes) {
                GradingKey key = new GradingKey(questionType, annotation.graderType());
                Grader existing = map.put(key, grader);
                if (existing != null) {
                    throw new IllegalStateException(
                        "Duplicate grader for key " + key + ": " +
                            existing.getClass().getName() + " and " + grader.getClass().getName()
                    );
                }
            }
        }

        return map;
    }

    private Map<GradingKey, Class<? extends Rubric>> loadRubricClasses(Set<Class<? extends BaseRubric>> rubricClasses) {
        Map<GradingKey, Class<? extends Rubric>> map = new HashMap<>();

        for (Class<? extends BaseRubric> rubricClass : rubricClasses) {
            BaseRubric.RubricMetadata metadata = BaseRubric.metadataFor(rubricClass);

            for (BaseRubric.RubricMetadata.Combination combination : metadata.validCombinations()) {
                GradingKey key = new GradingKey(combination.questionType(), combination.graderType());
                Class<? extends Rubric> existing = map.put(key, rubricClass);
                if (existing != null) {
                    throw new IllegalStateException(
                        "Duplicate rubric for key " + key + ": " +
                            existing.getName() + " and " + rubricClass.getName()
                    );
                }
            }
        }

        return map;
    }

    private record GradingHandlers(
        Grader grader,
        Class<? extends Rubric> rubricClass
    ) {
    }

    private static GradingHandlers mergeHandlers(GradingKey key, GradingHandlers existing, GradingHandlers incoming) {
        if (existing == null) {
            return incoming;
        }
        if (existing.grader() != null && incoming.grader() != null) {
            throw new IllegalStateException("Duplicate grader for key " + key);
        }
        if (existing.rubricClass() != null && incoming.rubricClass() != null) {
            throw new IllegalStateException("Duplicate rubric class for key " + key);
        }
        return new GradingHandlers(
            incoming.grader() != null ? incoming.grader() : existing.grader(),
            incoming.rubricClass() != null ? incoming.rubricClass() : existing.rubricClass()
        );
    }
}
