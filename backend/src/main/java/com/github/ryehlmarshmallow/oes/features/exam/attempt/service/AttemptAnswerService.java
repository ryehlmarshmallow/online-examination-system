package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptAnswersResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptQuestionAnswerResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptAccessDeniedException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptNotFoundException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttemptAnswerService {

    private final ExamAttemptRepository examAttemptRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;
    private final AttemptAnswerVisibilityService attemptAnswerVisibilityService;
    private final AttemptGradeVisibilityService attemptGradeVisibilityService;

    public AttemptAnswersResponse getAttemptAnswers(UUID requesterUserId, UUID attemptId) {
        ExamAttempt attempt = examAttemptRepository.findDetailedById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        // 1. Prioritize Staff Permissions
        try {
            classroomAuthorizationService.requireManageGrades(attempt.getExam().getClassroom().getId(), requesterUserId);

            boolean requesterIsStudentOwner = attempt.getStudent() != null &&
                attempt.getStudent().getId() != null &&
                attempt.getStudent().getId().equals(requesterUserId);
            boolean isInProgress = attempt.getStatus() == ExamAttempt.Status.IN_PROGRESS;

            // Even staff should not see answers for their own in-progress attempts
            boolean showRubric = !(requesterIsStudentOwner && isInProgress);
            boolean showGrade = !(requesterIsStudentOwner && isInProgress);

            return new AttemptAnswersResponse(
                attempt.getId(),
                attempt.getStatus(),
                showRubric,
                showGrade,
                toAnswerItems(attempt.getResponses(), showRubric, showGrade),
                showRubric ? null : "Rubric is hidden during attempt",
                showGrade ? null : "Grade is hidden during attempt"
            );
        } catch (IllegalArgumentException ignored) {
            // Not a staff member with grade permissions, fall back to owner check
        }

        // 2. Fallback to Owner Checks
        boolean requesterIsStudentOwner =
            attempt.getStudent() != null && attempt.getStudent().getId() != null && attempt.getStudent().getId().equals(requesterUserId);

        if (requesterIsStudentOwner) {
            boolean rubricVisible = attemptAnswerVisibilityService.canStudentViewRubric(attempt);
            boolean gradeVisible = attemptGradeVisibilityService.canStudentViewOwnAttemptGrade(attempt);

            return new AttemptAnswersResponse(
                attempt.getId(),
                attempt.getStatus(),
                rubricVisible,
                gradeVisible,
                toAnswerItems(attempt.getResponses(), rubricVisible, gradeVisible),
                rubricVisible ? null : "Rubric is hidden by exam policy",
                gradeVisible ? null : "Grade is hidden by exam policy"
            );
        }

        throw new AttemptAccessDeniedException("You cannot view this attempt answers");
    }

    private static List<AttemptQuestionAnswerResponse> toAnswerItems(
        Collection<QuestionResponse> responses,
        boolean rubricVisible,
        boolean gradeVisible
    ) {
        return responses.stream()
            .map(response -> new AttemptQuestionAnswerResponse(
                response.getQuestion().getId(),
                response.getQuestion().getType(),
                response.getData(),
                rubricVisible ? response.getQuestion().getRubric() : null,
                gradeVisible ? response.getScore() : null,
                gradeVisible && response.isGraded(),
                gradeVisible && response.isOverridden()
            ))
            .toList();
    }
}

