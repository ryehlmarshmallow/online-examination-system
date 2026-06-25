package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttemptExpirationService {

    private final ExamAttemptRepository examAttemptRepository;
    private final AttemptGradeService attemptGradeService;

    @Scheduled(fixedDelayString = "${app.exam.expiration-check-interval-ms:60000}")
    @Transactional
    public void sweepExpiredAttempts() {
        log.debug("Starting sweep for expired attempts");
        Instant now = Instant.now();
        List<ExamAttempt> activeAttempts = examAttemptRepository.findByStatus(ExamAttempt.Status.IN_PROGRESS);

        int count = 0;
        for (ExamAttempt attempt : activeAttempts) {
            Instant deadline = attempt.calculateDeadline();
            if (deadline != null && now.isAfter(deadline)) {
                log.info("Auto-submitting expired attempt {} for student {}", attempt.getId(), attempt.getStudent().getId());
                attempt.setStatus(ExamAttempt.Status.SUBMITTED);
                attempt.setSubmittedAt(deadline);
                attemptGradeService.autoGradeAttempt(attempt);
                examAttemptRepository.save(attempt);
                count++;
            }
        }
        if (count > 0) {
            log.info("Auto-submitted {} expired attempts during sweep", count);
        }
    }

    @Transactional
    public void closeExpiredAttemptsForExam(Exam exam) {
        log.info("Manually closing expired attempts for exam {}", exam.getId());
        Instant now = Instant.now();
        List<ExamAttempt> activeAttempts = examAttemptRepository.findByExamIdAndStatus(exam.getId(), ExamAttempt.Status.IN_PROGRESS);

        int count = 0;
        for (ExamAttempt attempt : activeAttempts) {
            Instant deadline = attempt.calculateDeadline();
            if (deadline != null && now.isAfter(deadline)) {
                attempt.setStatus(ExamAttempt.Status.SUBMITTED);
                attempt.setSubmittedAt(deadline);
                attemptGradeService.autoGradeAttempt(attempt);
                examAttemptRepository.save(attempt);
                count++;
            }
        }
        if (count > 0) {
            log.info("Auto-submitted {} expired attempts for exam {}", count, exam.getId());
        }
    }

}
