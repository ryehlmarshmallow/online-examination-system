package com.github.ryehlmarshmallow.oes.common.security.ratelimit;

import com.github.ryehlmarshmallow.oes.common.exception.RateLimitException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.Duration;

@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final StringRedisTemplate redisTemplate;
    private final HttpServletRequest request;

    @Around("@annotation(RateLimit) || @annotation(RateLimits)")
    public Object enforceRateLimit(ProceedingJoinPoint joinPoint) throws Throwable {
        String clientIp = getClientIp(request);
        String methodSignature = joinPoint.getSignature().toLongString();

        for (RateLimit rateLimit : resolveRateLimits(joinPoint)) {
            String redisKey = "ratelimit:" + clientIp + ":" + methodSignature + ":" +
                rateLimit.limit() + ":" + rateLimit.timeWindowSeconds();

            Long currentCount = redisTemplate.opsForValue().increment(redisKey);

            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(redisKey, Duration.ofSeconds(rateLimit.timeWindowSeconds()));
            }

            if (currentCount != null && currentCount > rateLimit.limit()) {
                throw new RateLimitException("Too many requests. Please try again later.");
            }
        }

        return joinPoint.proceed();
    }

    private RateLimit[] resolveRateLimits(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method interfaceMethod = signature.getMethod();
        Method targetMethod;

        try {
            targetMethod = joinPoint.getTarget().getClass()
                .getMethod(interfaceMethod.getName(), interfaceMethod.getParameterTypes());
        } catch (NoSuchMethodException ex) {
            targetMethod = interfaceMethod;
        }

        return targetMethod.getAnnotationsByType(RateLimit.class);
    }

    private String getClientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
