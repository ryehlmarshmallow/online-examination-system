package com.github.ryehlmarshmallow.oes.features.identity.controller;

import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.common.security.ratelimit.RateLimit;
import com.github.ryehlmarshmallow.oes.features.identity.dto.AuthRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.AuthResponse;
import com.github.ryehlmarshmallow.oes.features.identity.dto.RegisterRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.ResendVerificationRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.UserResponse;
import com.github.ryehlmarshmallow.oes.features.identity.dto.VerifyCodeRequest;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import com.github.ryehlmarshmallow.oes.features.identity.dto.ProfileUpdateRequest;
import com.github.ryehlmarshmallow.oes.features.identity.dto.PasswordUpdateRequest;

@RestController
@RequestMapping("/api/identity/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @RateLimit(limit = 10, timeWindowSeconds = 3600)
    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request, HttpSession session) {
        authService.register(request, session);
        return ResponseEntity.noContent().build();
    }

    @RateLimit(limit = 10, timeWindowSeconds = 3600)
    @PostMapping("/verify")
    public ResponseEntity<Void> verify(@Valid @RequestBody VerifyCodeRequest request, HttpSession session) {
        authService.verifyCode(request.code(), request.email(), session);
        return ResponseEntity.noContent().build();
    }

    @RateLimit(timeWindowSeconds = 60)
    @RateLimit(limit = 5, timeWindowSeconds = 3600)
    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody(required = false) ResendVerificationRequest request, HttpSession session) {
        String email = request == null ? null : request.email();
        authService.resendVerification(email, session);
        return ResponseEntity.noContent().build();
    }

    @RateLimit(limit = 10, timeWindowSeconds = 300)
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public AuthResponse login(@Valid @RequestBody AuthRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        User user = authService.getUserById(userDetails.getUser().getId());
        return new UserResponse(
            user.getUsername(),
            user.getFirstName(),
            user.getMiddleName(),
            user.getLastName(),
            user.getEmail(),
            user.getRole()
        );
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody ProfileUpdateRequest request
    ) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        authService.updateProfile(userDetails.getUser().getId(), request);
        User user = authService.getUserById(userDetails.getUser().getId());
        return ResponseEntity.ok(new UserResponse(
            user.getUsername(),
            user.getFirstName(),
            user.getMiddleName(),
            user.getLastName(),
            user.getEmail(),
            user.getRole()
        ));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody PasswordUpdateRequest request
    ) {
        if (userDetails == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        authService.updatePassword(userDetails.getUser().getId(), request);
        return ResponseEntity.noContent().build();
    }
}
