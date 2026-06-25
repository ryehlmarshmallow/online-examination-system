package com.github.ryehlmarshmallow.oes.features.question.entity.rubric;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.grading.core.GraderType;

import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Repeatable(RubricsFor.class)
public @interface RubricFor {
    boolean allQuestionTypes() default false;

    QuestionType[] questionTypes() default {};

    GraderType[] graderTypes() default {};
}
