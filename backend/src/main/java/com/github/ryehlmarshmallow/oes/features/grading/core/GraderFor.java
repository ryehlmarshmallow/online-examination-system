package com.github.ryehlmarshmallow.oes.features.grading.core;

import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import org.springframework.stereotype.Component;

import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface GraderFor {
    boolean allQuestionTypes() default false;

    QuestionType[] questionTypes() default {};

    GraderType graderType();
}
