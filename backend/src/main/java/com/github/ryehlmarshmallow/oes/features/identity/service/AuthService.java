package com.github.ryehlmarshmallow.oes.features.identity.service;

import com.github.ryehlmarshmallow.oes.common.exception.RateLimitException;
import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.features.identity.dto.AuthRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.AuthResponse;
import com.github.ryehlmarshmallow.oes.features.identity.dto.RegisterRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.ProfileUpdateRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.PasswordUpdateRequest;
import com.github.ryehlmarshmallow.oes.features.identity.entity.UserRole;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.entity.VerificationCode;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.identity.repository.VerificationCodeRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long CODE_EXPIRATION_HOURS = 24;
    private static final long RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_FAILED_VERIFICATION_ATTEMPTS = 5;
    private static final String PENDING_VERIFICATION_USER_ID = "pending_verification_user_id";
    private static final String FAILED_VERIFICATION_ATTEMPTS = "failed_verification_attempts";
    private static final String RESEND_VERIFICATION_GENERIC_RESPONSE =
        "If the account is eligible, a verification email has been sent.";

    private final UserRepository userRepository;
    private final VerificationCodeRepository codeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;

    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy();

    @Transactional
    public String register(RegisterRequest request, HttpSession session) {
        String normalizedEmail = request.email().trim().toLowerCase();
        String normalizedFirstName = request.firstName().trim();
        String normalizedMiddleName = request.middleName() == null ? null : request.middleName().trim();
        String normalizedLastName = request.lastName().trim();
        if (normalizedMiddleName != null && normalizedMiddleName.isEmpty()) {
            normalizedMiddleName = null;
        }
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail) || userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username or email already in use");
        }

        User user = User.builder()
            .username(request.username())
            .firstName(normalizedFirstName)
            .middleName(normalizedMiddleName)
            .lastName(normalizedLastName)
            .email(normalizedEmail)
            .passwordHash(passwordEncoder.encode(request.password()))
            .role(UserRole.USER)
            .isEnabled(false)
            .build();
        userRepository.save(user);

        generateAndSendCode(user);
        session.setAttribute(PENDING_VERIFICATION_USER_ID, user.getId().toString());
        session.setAttribute(FAILED_VERIFICATION_ATTEMPTS, 0);

        return "Registration successful. Please check your email to verify your account.";
    }

    @Transactional
    public String verifyCode(String code, String email, HttpSession session) {
        User user = resolveVerificationUser(email, session);
        VerificationCode verificationCode = codeRepository.findByUserIdAndCode(user.getId(), code).orElse(null);
        if (verificationCode == null) {
            int failedAttempts = session.getAttribute(FAILED_VERIFICATION_ATTEMPTS) == null
                ? 0
                : (Integer) session.getAttribute(FAILED_VERIFICATION_ATTEMPTS);
            failedAttempts++;
            session.setAttribute(FAILED_VERIFICATION_ATTEMPTS, failedAttempts);
            if (failedAttempts >= MAX_FAILED_VERIFICATION_ATTEMPTS) {
                clearVerificationSession(session);
                throw new IllegalStateException("Too many failed attempts. Please sign up again.");
            }
            throw new IllegalArgumentException("Invalid verification code");
        }

        if (verificationCode.getExpiryDate().isBefore(Instant.now())) {
            clearVerificationSession(session);
            throw new IllegalArgumentException("Verification code expired. Please sign up again.");
        }

        User verifiedUser = verificationCode.getUser();
        verifiedUser.setEnabled(true);
        userRepository.save(verifiedUser);
        codeRepository.delete(verificationCode);
        clearVerificationSession(session);

        return "Account verified successfully";
    }

    @Transactional
    public String resendVerification(String email, HttpSession session) {
        User user = resolveVerificationUser(email, session);

        if (user.isEnabled()) {
            clearVerificationSession(session);
            return RESEND_VERIFICATION_GENERIC_RESPONSE;
        }

        codeRepository.findByUser(user).ifPresent(existingCode -> {
            Instant resendAllowedAt = existingCode.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS);
            if (resendAllowedAt.isAfter(Instant.now())) {
                throw new RateLimitException("Please wait before requesting another verification email.");
            }

            codeRepository.delete(existingCode);
            codeRepository.flush();
        });

        generateAndSendCode(user);
        session.setAttribute(FAILED_VERIFICATION_ATTEMPTS, 0);

        return RESEND_VERIFICATION_GENERIC_RESPONSE;
    }

    public AuthResponse login(AuthRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String identifier = request.identifier().trim();
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Username/Email or password is incorrect");
        }

        if (user.isLocked()) {
            throw new LockedException("Account suspended");
        }

        if (!user.isEnabled()) {
            throw new DisabledException("Account unverified");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.password())
            );
        } catch (DisabledException | LockedException ex) {
            throw ex;
        } catch (AuthenticationException ex) {
            throw new BadCredentialsException("Username/Email or password is incorrect");
        }

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        if (userDetails == null) {
            throw new IllegalStateException("Authentication principal cannot be null");
        }

        SecurityContext context = securityContextHolderStrategy.createEmptyContext();
        context.setAuthentication(authentication);
        securityContextHolderStrategy.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        User authenticatedUser = Objects.requireNonNull(userDetails.getUser(), "User entity cannot be null");

        return new AuthResponse(
            authenticatedUser.getUsername(),
            authenticatedUser.getFirstName(),
            authenticatedUser.getMiddleName(),
            authenticatedUser.getLastName(),
            authenticatedUser.getEmail(),
            authenticatedUser.getRole()
        );
    }

    private void generateAndSendCode(User user) {
        Instant issuedAt = Instant.now();
        String code = generateUniqueCode();
        codeRepository.save(VerificationCode.builder()
            .code(code)
            .user(user)
            .createdAt(issuedAt)
            .expiryDate(issuedAt.plus(CODE_EXPIRATION_HOURS, ChronoUnit.HOURS))
            .build());

        emailService.sendVerificationCodeEmail(user.getEmail(), code);
    }

    private String generateUniqueCode() {
        String code;
        do {
            code = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
        } while (codeRepository.existsByCode(code));
        return code;
    }

    private void clearVerificationSession(HttpSession session) {
        session.removeAttribute(PENDING_VERIFICATION_USER_ID);
        session.removeAttribute(FAILED_VERIFICATION_ATTEMPTS);
    }

    private User resolveVerificationUser(String email, HttpSession session) {
        String userId = (String) session.getAttribute(PENDING_VERIFICATION_USER_ID);
        if (userId != null && !userId.isBlank()) {
            return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalStateException("Verification session not found. Please sign up again."));
        }

        String normalizedEmail = normalizeOptionalEmail(email);
        if (normalizedEmail == null) {
            throw new IllegalStateException("Verification session not found. Please sign up again.");
        }

        return userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new IllegalStateException("Verification session not found. Please sign up again."));
    }

    private String normalizeOptionalEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalized = email.trim().toLowerCase();
        return normalized.isEmpty() ? null : normalized;
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public void updateProfile(UUID userId, ProfileUpdateRequest request) {
        User user = getUserById(userId);

        String normalizedFirstName = request.firstName().trim();
        String normalizedMiddleName = request.middleName() == null ? null : request.middleName().trim();
        String normalizedLastName = request.lastName().trim();
        if (normalizedMiddleName != null && normalizedMiddleName.isEmpty()) {
            normalizedMiddleName = null;
        }

        user.setFirstName(normalizedFirstName);
        user.setMiddleName(normalizedMiddleName);
        user.setLastName(normalizedLastName);
        userRepository.save(user);
    }

    @Transactional
    public void updatePassword(UUID userId, PasswordUpdateRequest request) {
        User user = getUserById(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
