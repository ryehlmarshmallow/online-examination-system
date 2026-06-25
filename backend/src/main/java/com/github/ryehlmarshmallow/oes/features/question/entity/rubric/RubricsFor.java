package com.github.ryehlmarshmallow.oes.features.question.entity.rubric;

import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RubricsFor {
    RubricFor[] value();
}
