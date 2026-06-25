package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptGradeResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.ManualGradeRequest;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptAccessDeniedException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptNotFoundException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.QuestionResponseRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.grading.core.GradingResult;
import com.github.ryehlmarshmallow.oes.features.grading.service.GradingService;
import org.springframework.context.ApplicationEventPublisher;
import com.github.ryehlmarshmallow.oes.features.notification.event.ExamGradedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttemptGradeService {

    private final ExamAttemptRepository examAttemptRepository;
    private final QuestionResponseRepository questionResponseRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;
    private final AttemptGradeVisibilityService attemptGradeVisibilityService;
    private final GradingService gradingService;
    private final ApplicationEventPublisher eventPublisher;

    public AttemptGradeResponse getAttemptGrade(UUID requesterUserId, UUID attemptId) {
        ExamAttempt attempt = examAttemptRepository.findDetailedById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        // 1. Prioritize Staff Permissions
        try {
            classroomAuthorizationService.requireManageGrades(attempt.getExam().getClassroom().getId(), requesterUserId);
            return new AttemptGradeResponse(
                attempt.getId(),
                attempt.getStatus(),
                true,
                attempt.getScore(),
                null
            );
        } catch (IllegalArgumentException ignored) {
            // Not a staff member with grade permissions, fall back to owner check
        }

        // 2. Fallback to Owner Checks
        boolean requesterIsStudentOwner =
            attempt.getStudent() != null && attempt.getStudent().getId() != null && attempt.getStudent().getId().equals(requesterUserId);

        if (requesterIsStudentOwner) {
            boolean visible = attemptGradeVisibilityService.canStudentViewOwnAttemptGrade(attempt);
            return new AttemptGradeResponse(
                attempt.getId(),
                attempt.getStatus(),
                visible,
                visible ? attempt.getScore() : null,
                visible ? null : "Grade is hidden by exam policy"
            );
        }

        throw new AttemptAccessDeniedException("You cannot view this attempt grade");
    }

    @Transactional
    public void manualGradeQuestion(UUID requesterUserId, UUID attemptId, UUID questionId, ManualGradeRequest request) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        // 1. Authorization
        classroomAuthorizationService.requireManageGrades(attempt.getExam().getClassroom().getId(), requesterUserId);

        // 2. Validate attempt status
        if (attempt.getStatus() == ExamAttempt.Status.IN_PROGRESS) {
            throw new IllegalStateException("Cannot grade an attempt that is still in progress");
        }

        // 3. Find and update QuestionResponse
        QuestionResponse response = questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId)
            .orElseThrow(() -> new IllegalArgumentException("Response not found for question " + questionId + " in attempt " + attemptId));

        // 4. Validate manual grade range
        if (request.getScore().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Manual grade cannot be negative");
        }
        if (request.getScore().compareTo(response.getQuestion().getMaxPoints()) > 0) {
            throw new IllegalArgumentException("Manual grade (" + request.getScore() + ") exceeds maximum points (" + response.getQuestion().getMaxPoints() + ") for this question");
        }

        response.setScore(request.getScore());
        response.setGraded(true);
        response.setOverridden(true);
        questionResponseRepository.save(response);

        recalculateAttemptScoreAndStatus(attempt);
    }

    @Transactional
    public void resetManualGrade(UUID requesterUserId, UUID attemptId, UUID questionId) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        // 1. Authorization
        classroomAuthorizationService.requireManageGrades(attempt.getExam().getClassroom().getId(), requesterUserId);

        // 2. Validate attempt status
        if (attempt.getStatus() == ExamAttempt.Status.IN_PROGRESS) {
            throw new IllegalStateException("Cannot grade an attempt that is still in progress");
        }

        // 3. Find and update QuestionResponse
        QuestionResponse response = questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId)
            .orElseThrow(() -> new IllegalArgumentException("Response not found for question " + questionId + " in attempt " + attemptId));

        // 4. Reset override and regrade
        response.setOverridden(false);
        GradingResult result = gradingService.grade(response.getQuestion(), response.getData());
        response.setScore(result.score());
        response.setGraded(result.isGraded());
        questionResponseRepository.save(response);

        recalculateAttemptScoreAndStatus(attempt);
    }

    private void recalculateAttemptScoreAndStatus(ExamAttempt attempt) {
        // Recalculate attempt score
        BigDecimal totalScore = attempt.getResponses().stream()
            .map(QuestionResponse::getScore)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        attempt.setScore(totalScore);

        // Update attempt status based on whether all responses are graded
        boolean allGraded = attempt.getResponses().stream().allMatch(QuestionResponse::isGraded);
        boolean becameGraded = false;
        if (allGraded && attempt.getStatus() != ExamAttempt.Status.GRADED) {
            attempt.setStatus(ExamAttempt.Status.GRADED);
            becameGraded = true;
        } else if (!allGraded) {
            attempt.setStatus(ExamAttempt.Status.SUBMITTED);
        }

        ExamAttempt saved = examAttemptRepository.save(attempt);
        if (becameGraded) {
            eventPublisher.publishEvent(new ExamGradedEvent(
                this,
                saved.getExam().getId(),
                saved.getExam().getClassroom().getId(),
                saved.getId(),
                saved.getStudent().getId(),
                saved.getExam().getTitle()
            ));
        }
    }

    @Transactional
    public void autoGradeAttempt(ExamAttempt attempt) {
        BigDecimal totalScore = BigDecimal.ZERO;
        boolean allGraded = true;

        for (QuestionResponse response : attempt.getResponses()) {
            if (!response.isOverridden()) {
                GradingResult result = gradingService.grade(response.getQuestion(), response.getData());
                response.setScore(result.score());
                response.setGraded(result.isGraded());
            }

            if (response.getScore() != null) {
                totalScore = totalScore.add(response.getScore());
            }

            if (!response.isGraded()) {
                allGraded = false;
            }

            questionResponseRepository.save(response);
        }

        attempt.setScore(totalScore);
        boolean becameGraded = false;
        if (allGraded && attempt.getStatus() != ExamAttempt.Status.GRADED) {
            attempt.setStatus(ExamAttempt.Status.GRADED);
            becameGraded = true;
        }

        ExamAttempt saved = examAttemptRepository.save(attempt);
        if (becameGraded) {
            eventPublisher.publishEvent(new ExamGradedEvent(
                this,
                saved.getExam().getId(),
                saved.getExam().getClassroom().getId(),
                saved.getId(),
                saved.getStudent().getId(),
                saved.getExam().getTitle()
            ));
        }
    }
}

