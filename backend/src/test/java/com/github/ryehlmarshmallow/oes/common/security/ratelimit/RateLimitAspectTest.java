package com.github.ryehlmarshmallow.oes.common.security.ratelimit;

import com.github.ryehlmarshmallow.oes.common.exception.RateLimitException;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.lang.reflect.Method;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RateLimitAspectTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private HttpServletRequest request;

    @Mock
    private ProceedingJoinPoint joinPoint;

    @Mock
    private MethodSignature methodSignature;

    private RateLimitAspect rateLimitAspect;

    @BeforeEach
    void setUp() {
        rateLimitAspect = new RateLimitAspect(redisTemplate, request);

        when(joinPoint.getSignature()).thenReturn(methodSignature);
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void shouldAllowRequestWhenWithinMinuteAndDailyLimits() throws Throwable {
        Method method = RateLimitedEndpoint.class.getMethod("createInviteLink");

        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getTarget()).thenReturn(new RateLimitedEndpoint());
        when(joinPoint.getSignature().toLongString()).thenReturn("createInviteLinkSignature");
        when(valueOperations.increment(anyString())).thenReturn(1L, 1L);
        when(joinPoint.proceed()).thenReturn("ok");

        Object result = rateLimitAspect.enforceRateLimit(joinPoint);

        assertEquals("ok", result);
        verify(redisTemplate).expire(anyString(), eq(Duration.ofSeconds(60)));
        verify(redisTemplate).expire(anyString(), eq(Duration.ofSeconds(86_400)));
        verify(joinPoint).proceed();
    }

    @Test
    void shouldBlockWhenMinuteLimitIsExceeded() throws Throwable {
        Method method = RateLimitedEndpoint.class.getMethod("createInviteLink");

        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getTarget()).thenReturn(new RateLimitedEndpoint());
        when(joinPoint.getSignature().toLongString()).thenReturn("createInviteLinkSignature");
        when(valueOperations.increment(anyString())).thenReturn(11L);

        assertThrows(RateLimitException.class, () -> rateLimitAspect.enforceRateLimit(joinPoint));

        verify(joinPoint, never()).proceed();
    }

    @Test
    void shouldBlockWhenDailyLimitIsExceededEvenIfMinuteLimitPasses() throws Throwable {
        Method method = RateLimitedEndpoint.class.getMethod("createInviteLink");

        when(methodSignature.getMethod()).thenReturn(method);
        when(joinPoint.getTarget()).thenReturn(new RateLimitedEndpoint());
        when(joinPoint.getSignature().toLongString()).thenReturn("createInviteLinkSignature");
        when(valueOperations.increment(anyString())).thenReturn(10L, 101L);

        assertThrows(RateLimitException.class, () -> rateLimitAspect.enforceRateLimit(joinPoint));

        verify(joinPoint, never()).proceed();
    }

    private static class RateLimitedEndpoint {

        @RateLimit(limit = 10, timeWindowSeconds = 60)
        @RateLimit(limit = 100, timeWindowSeconds = 86_400)
        public void createInviteLink() {
        }
    }
}
