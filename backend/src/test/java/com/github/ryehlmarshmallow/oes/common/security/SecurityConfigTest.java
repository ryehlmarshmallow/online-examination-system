package com.github.ryehlmarshmallow.oes.common.security;

import com.github.ryehlmarshmallow.oes.common.testing.PostgresIntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigTest extends PostgresIntegrationTestBase {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setupRateLimitRedisMock() {
        ValueOperations<String, String> valueOperations = Mockito.mock(ValueOperations.class);
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.increment(Mockito.anyString())).thenReturn(1L);
        Mockito.when(redisTemplate.expire(Mockito.anyString(), Mockito.any())).thenReturn(true);
    }

    @Test
    void protectedEndpointsShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/some-protected-resource"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void publicEndpointsShouldBeAccessible() throws Exception {
        mockMvc.perform(post("/api/identity/auth/verify")
                .contentType("application/json")
                .content("{}"))
            .andExpect(status().isBadRequest()); // Accessible, but fails validation
    }

    @Test
    void openApiEndpointShouldBeAccessible() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk());
    }
}