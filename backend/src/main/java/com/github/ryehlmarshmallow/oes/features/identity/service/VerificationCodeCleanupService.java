package com.github.ryehlmarshmallow.oes.features.identity.service;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.entity.VerificationCode;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.identity.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VerificationCodeCleanupService {

    private final VerificationCodeRepository codeRepository;
    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanUpExpiredCodesAndUsers() {
        List<VerificationCode> expiredCodes = codeRepository.findAllByExpiryDateBefore(Instant.now());

        for (VerificationCode code : expiredCodes) {
            User user = code.getUser();
            codeRepository.delete(code);

            if (!user.isEnabled()) {
                userRepository.delete(user);
            }
        }
    }
}
