package com.github.ryehlmarshmallow.oes.common.security.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Repeatable;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Repeatable(RateLimits.class)
public @interface RateLimit {
    int limit() default 1;

    int timeWindowSeconds();
}
