package com.github.ryehlmarshmallow.oes.features.identity.repository;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.entity.VerificationCode;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    boolean existsByCode(String code);

    Optional<VerificationCode> findByUser(User user);

    Optional<VerificationCode> findByUserIdAndCode(UUID userId, String code);

    @EntityGraph(attributePaths = {"user"})
    List<VerificationCode> findAllByExpiryDateBefore(Instant time);
}
