package com.github.ryehlmarshmallow.oes.features.identity;

import com.github.ryehlmarshmallow.oes.common.testing.PostgresIntegrationTestBase;
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
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "management.health.mail.enabled=false")
@AutoConfigureMockMvc
class AuthIntegrationTest extends PostgresIntegrationTestBase {

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

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setupRateLimitRedisMock() {
        ValueOperations<String, String> valueOperations = Mockito.mock(ValueOperations.class);
        Mockito.when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        Mockito.when(valueOperations.increment(Mockito.anyString())).thenReturn(1L);
        Mockito.when(redisTemplate.expire(Mockito.anyString(), Mockito.any())).thenReturn(true);
    }

    @Test
    void shouldRegisterUserSuccessfully() throws Exception {
        RegisterRequest request = new RegisterRequest("tester", "Test", null, "User", "test@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());
    }

    @Test
    void shouldLoginCaseInsensitiveEmail() throws Exception {
        String email = "MixedCaseUser@example.com";
        String username = "mixedcaseuser";
        String password = "Password123!";

        registerAndVerifyUser(username, email, password);

        AuthRequest request = new AuthRequest(email.toUpperCase(Locale.ROOT), password);

        mockMvc.perform(post("/api/identity/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email.toLowerCase(Locale.ROOT)));
    }

    @Test
    void shouldReturnUnauthorizedForUnverifiedAccountWhenPasswordIsWrong() throws Exception {
        RegisterRequest request = new RegisterRequest("pending-user-wrong-password", "Pending", null, "User", "pending-wrong@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());

        AuthRequest loginRequest = new AuthRequest("pending-wrong@example.com", "incorrect-password");

        mockMvc.perform(post("/api/identity/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Username/Email or password is incorrect"));
    }

    @Test
    void shouldReturnForbiddenForUnverifiedAccountWhenPasswordIsCorrect() throws Exception {
        RegisterRequest request = new RegisterRequest("pending-user-correct-password", "Pending", null, "User", "pending-correct@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());

        AuthRequest loginRequest = new AuthRequest("pending-correct@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("Account unverified"))
            .andExpect(jsonPath("$.code").value("ACCOUNT_UNVERIFIED"));
    }

    @Test
    void shouldReturnForbiddenForLockedAccountWhenPasswordIsCorrect() throws Exception {
        RegisterRequest request = new RegisterRequest("locked-user-correct-password", "Locked", null, "User", "locked-correct@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());

        User lockedUser = userRepository.findByEmailIgnoreCase("locked-correct@example.com")
            .orElseThrow(() -> new IllegalStateException("Expected user to be persisted"));
        lockedUser.setLocked(true);
        userRepository.save(lockedUser);

        AuthRequest loginRequest = new AuthRequest("locked-correct@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("Account suspended"))
            .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
    }

    @Test
    void shouldReturnUnauthorizedForLockedAccountWhenPasswordIsWrong() throws Exception {
        RegisterRequest request = new RegisterRequest("locked-user-wrong-password", "Locked", null, "User", "locked-wrong@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());

        User lockedUser = userRepository.findByEmailIgnoreCase("locked-wrong@example.com")
            .orElseThrow(() -> new IllegalStateException("Expected user to be persisted"));
        lockedUser.setLocked(true);
        userRepository.save(lockedUser);

        AuthRequest loginRequest = new AuthRequest("locked-wrong@example.com", "incorrect-password");

        mockMvc.perform(post("/api/identity/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("Username/Email or password is incorrect"));
    }

    @Test
    void shouldBlockImmediateResendVerificationAfterRegister() throws Exception {
        String email = "cooldown@example.com";
        RegisterRequest request = new RegisterRequest("cooldown-user", "Cooldown", null, "User", email, "password123");

        MvcResult registerResult = mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent())
            .andReturn();

        MockHttpSession session = (MockHttpSession) registerResult.getRequest().getSession(false);

        mockMvc.perform(post("/api/identity/auth/resend-verification")
                .session(session))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.error").value("Please wait before requesting another verification email."));
    }

    @Test
    void shouldAllowResendVerificationAfterCooldown() throws Exception {
        String email = "cooldown-pass@example.com";
        RegisterRequest request = new RegisterRequest("cooldown-pass-user", "Cooldown", "Pass", "User", email, "password123");

        MvcResult registerResult = mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent())
            .andReturn();

        MockHttpSession session = (MockHttpSession) registerResult.getRequest().getSession(false);

        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalStateException("Expected user to be persisted"));
        VerificationCode code = tokenRepository.findByUser(user)
            .orElseThrow(() -> new IllegalStateException("Expected verification token to be persisted"));

        tokenRepository.delete(code);
        tokenRepository.flush();
        tokenRepository.save(VerificationCode.builder()
            .code("123456")
            .user(user)
            .createdAt(Instant.now().minusSeconds(61))
            .expiryDate(Instant.now().plusSeconds(3600))
            .build());

        mockMvc.perform(post("/api/identity/auth/resend-verification")
                .session(session))
            .andExpect(status().isNoContent());
    }

    @Test
    void shouldVerifyAccountFromAnotherSessionWhenEmailIsProvided() throws Exception {
        String email = "cross-device-verify@example.com";
        RegisterRequest request = new RegisterRequest("cross-device-verify", "Cross", null, "Device", email, "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());

        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalStateException("Expected user to be persisted"));
        VerificationCode code = tokenRepository.findByUser(user)
            .orElseThrow(() -> new IllegalStateException("Expected verification code to be persisted"));

        mockMvc.perform(post("/api/identity/auth/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", code.getCode(), "email", email))))
            .andExpect(status().isNoContent());
    }

    @Test
    void shouldClearVerificationSessionAfterSuccessfulVerification() throws Exception {
        String email = "verify-session-clear@example.com";
        RegisterRequest request = new RegisterRequest("verify-session-clear", "Verify", null, "Session", email, "password123");

        MvcResult registerResult = mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent())
            .andReturn();

        MockHttpSession session = (MockHttpSession) registerResult.getRequest().getSession(false);
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalStateException("Expected user to be persisted"));
        VerificationCode code = tokenRepository.findByUser(user)
            .orElseThrow(() -> new IllegalStateException("Expected verification code to be persisted"));

        mockMvc.perform(post("/api/identity/auth/verify")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", code.getCode()))))
            .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/identity/auth/verify")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", code.getCode()))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Verification session not found. Please sign up again."));
    }

    @Test
    void shouldClearVerificationSessionAfterTooManyFailedAttempts() throws Exception {
        RegisterRequest request = new RegisterRequest("lockout-user", "Lockout", null, "User", "lockout@example.com", "password123");

        MvcResult registerResult = mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent())
            .andReturn();

        MockHttpSession session = (MockHttpSession) registerResult.getRequest().getSession(false);

        for (int attempt = 1; attempt <= 4; attempt++) {
            mockMvc.perform(post("/api/identity/auth/verify")
                    .session(session)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(Map.of("code", "000000"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid verification code"));
        }

        mockMvc.perform(post("/api/identity/auth/verify")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", "000000"))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Too many failed attempts. Please sign up again."));

        mockMvc.perform(post("/api/identity/auth/resend-verification")
                .session(session))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Verification session not found. Please sign up again."));
    }

    private void registerAndVerifyUser(String username, String email, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(username, "First", null, "Last", email, password);

        MvcResult registerResult = mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
            .andExpect(status().isNoContent())
            .andReturn();

        MockHttpSession session = (MockHttpSession) registerResult.getRequest().getSession(false);

        User savedUser = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalStateException("Expected user to be persisted"));
        VerificationCode code = tokenRepository.findByUser(savedUser)
            .orElseThrow(() -> new IllegalStateException("Expected verification code to be persisted"));

        mockMvc.perform(post("/api/identity/auth/verify")
                .session(session)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", code.getCode()))))
            .andExpect(status().isNoContent());
    }

    @Test
    void shouldRejectRegistrationWhenFirstOrLastNameMissing() throws Exception {
        RegisterRequest missingFirstName = new RegisterRequest("tester-a", "   ", null, "User", "test-a@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(missingFirstName)))
            .andExpect(status().isBadRequest());

        RegisterRequest missingLastName = new RegisterRequest("tester-b", "Test", null, "", "test-b@example.com", "password123");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(missingLastName)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectRegistrationWhenPasswordTooShort() throws Exception {
        RegisterRequest shortPassword = new RegisterRequest("tester-c", "Test", null, "User", "test-c@example.com", "1234567");

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(shortPassword)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("password: Password must be at least 8 characters long"));
    }

    @Test
    void shouldReturnMalformedRequestBodyErrorForInvalidRegisterJson() throws Exception {
        String malformedJson = "{\"username\":\"tester\",\"firstName\":\"Test\"";

        mockMvc.perform(post("/api/identity/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(malformedJson))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("Malformed request body"));
    }
}

