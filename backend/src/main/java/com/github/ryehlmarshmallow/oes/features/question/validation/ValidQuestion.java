package com.github.ryehlmarshmallow.oes.features.question.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = QuestionValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidQuestion {
    String message() default "Invalid question configuration";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
