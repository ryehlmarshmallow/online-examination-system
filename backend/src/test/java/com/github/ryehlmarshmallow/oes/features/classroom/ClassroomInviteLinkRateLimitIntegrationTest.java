package com.github.ryehlmarshmallow.oes.features.classroom;

import com.github.ryehlmarshmallow.oes.common.testing.PostgresIntegrationTestBase;
import com.github.ryehlmarshmallow.oes.features.classroom.dto.CreateClassroomRequest;
import com.github.ryehlmarshmallow.oes.features.classroom.dto.CreateInviteLinkRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.AuthRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.RegisterRequest;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.entity.VerificationCode;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.identity.repository.VerificationCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "management.health.mail.enabled=false")
@AutoConfigureMockMvc
class ClassroomInviteLinkRateLimitIntegrationTest extends PostgresIntegrationTestBase {

    private static final String TEST_PASSWORD = "Password123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationCodeRepository tokenRepository;

    @MockitoBean
    private JavaMailSender mailSender;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    private ValueOperations<String, String> valueOperations;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setupRateLimitRedisMock() {
        valueOperations = Mockito.mock(ValueOperations.class);
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.increment(Mockito.anyString())).thenReturn(1L);
        Mockito.when(redisTemplate.expire(Mockito.anyString(), Mockito.any())).thenReturn(true);
    }

    @Test
    void shouldReturnTooManyRequestsWhenMinuteLimitIsExceededForCreateInviteLink() throws Exception {
        Mockito.when(valueOperations.increment(Mockito.anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            if (key.contains(":10:60")) {
                return 11L;
            }
            if (key.contains(":100:86400")) {
                return 1L;
            }
            return 1L;
        });

        MockHttpSession session = registerVerifyAndLogin("minute_limit_owner", "minute_limit_owner@example.com");
        UUID classroomId = createClassroom(session, "Minute Limit Classroom");

        CreateInviteLinkRequest request = new CreateInviteLinkRequest(Instant.now().plusSeconds(3600), 5);

        mockMvc.perform(post("/api/classrooms/{classroomId}/invite-links", classroomId)
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.error").value("Too many requests. Please try again later."));
    }

    @Test
    void shouldReturnTooManyRequestsWhenDailyLimitIsExceededForCreateInviteLink() throws Exception {
        Mockito.when(valueOperations.increment(Mockito.anyString())).thenAnswer(invocation -> {
            String key = invocation.getArgument(0);
            if (key.contains(":10:60")) {
                return 10L;
            }
            if (key.contains(":100:86400")) {
                return 101L;
            }
            return 1L;
        });

        MockHttpSession session = registerVerifyAndLogin("daily_limit_owner", "daily_limit_owner@example.com");
        UUID classroomId = createClassroom(session, "Daily Limit Classroom");

        CreateInviteLinkRequest request = new CreateInviteLinkRequest(Instant.now().plusSeconds(3600), 5);

        mockMvc.perform(post("/api/classrooms/{classroomId}/invite-links", classroomId)
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.error").value("Too many requests. Please try again later."));
    }

    private MockHttpSession registerVerifyAndLogin(String username, String email) throws Exception {
        MvcResult registerResult = mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    new RegisterRequest(username, "Rate", null, "Limited", email, TEST_PASSWORD)
                )))
            .andExpect(status().isNoContent())
            .andReturn();

        MockHttpSession registerSession = (MockHttpSession) registerResult.getRequest().getSession(false);

        User savedUser = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalStateException("Expected user to be persisted"));
        VerificationCode code = tokenRepository.findByUser(savedUser)
            .orElseThrow(() -> new IllegalStateException("Expected verification token to be persisted"));

        mockMvc.perform(post("/api/identity/auth/verify")
                .session(Objects.requireNonNull(registerSession))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", code.getCode()))))
            .andExpect(status().isNoContent());

        MvcResult loginResult = mockMvc.perform(post("/api/identity/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new AuthRequest(email, TEST_PASSWORD))))
            .andExpect(status().isOk())
            .andReturn();

        return (MockHttpSession) loginResult.getRequest().getSession(false);
    }

    private UUID createClassroom(MockHttpSession session, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/classrooms")
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateClassroomRequest(name, "rate limit test"))))
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        String classroomId = objectMapper.convertValue(body.required("id"), String.class);
        return UUID.fromString(classroomId);
    }
}
