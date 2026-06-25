package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptGradeResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.ManualGradeRequest;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptAccessDeniedException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.QuestionResponseRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.grading.service.GradingService;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponse;
import com.github.ryehlmarshmallow.oes.features.grading.core.GradingResult;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttemptGradeServiceTest {

    @Mock
    private ExamAttemptRepository examAttemptRepository;

    @Mock
    private QuestionResponseRepository questionResponseRepository;

    @Mock
    private ClassroomAuthorizationService classroomAuthorizationService;

    @Mock
    private AttemptGradeVisibilityService attemptGradeVisibilityService;

    @Mock
    private GradingService gradingService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private AttemptGradeService service;

    @BeforeEach
    void setUp() {
        service = new AttemptGradeService(
            examAttemptRepository,
            questionResponseRepository,
            classroomAuthorizationService,
            attemptGradeVisibilityService,
            gradingService,
            eventPublisher
        );
    }

    @Test
    void shouldHideScoreForOwnerStudentWhenPolicySaysHidden() {
        UUID studentId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(studentId);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));
        doThrow(new IllegalArgumentException("Not staff"))
            .when(classroomAuthorizationService)
            .requireManageGrades(attempt.getExam().getClassroom().getId(), studentId);
        when(attemptGradeVisibilityService.canStudentViewOwnAttemptGrade(attempt)).thenReturn(false);

        AttemptGradeResponse response = service.getAttemptGrade(studentId, attempt.getId());

        assertFalse(response.gradeVisible());
        assertNull(response.score());
        assertEquals("Grade is hidden by exam policy", response.reason());
    }

    @Test
    void shouldAllowGradeManagersToSeeScore() {
        UUID studentId = UUID.randomUUID();
        UUID staffId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(studentId);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));

        AttemptGradeResponse response = service.getAttemptGrade(staffId, attempt.getId());

        verify(classroomAuthorizationService).requireManageGrades(attempt.getExam().getClassroom().getId(), staffId);
        assertTrue(response.gradeVisible());
        assertEquals(new BigDecimal("88.000"), response.score());
    }

    @Test
    void shouldRejectOtherUsersWithoutManageGradesPermission() {
        UUID studentId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(studentId);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));
        doThrow(new IllegalArgumentException("forbidden"))
            .when(classroomAuthorizationService)
            .requireManageGrades(attempt.getExam().getClassroom().getId(), otherUserId);

        assertThrows(AttemptAccessDeniedException.class, () -> service.getAttemptGrade(otherUserId, attempt.getId()));
    }

    @Test
    void shouldResetManualGradeAndRegrade() {
        UUID staffId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();

        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).build();
        Exam exam = Exam.builder().id(UUID.randomUUID()).classroom(classroom).build();
        ExamAttempt attempt = ExamAttempt.builder()
            .id(attemptId)
            .exam(exam)
            .status(ExamAttempt.Status.GRADED)
            .score(new BigDecimal("10.000"))
            .build();

        Question question = Question.builder().id(questionId).build();
        QuestionResponse response = QuestionResponse.builder()
            .attempt(attempt)
            .question(question)
            .score(new BigDecimal("10.000"))
            .isGraded(true)
            .isOverridden(true)
            .build();

        response.setAttempt(attempt);
        attempt.setResponses(new LinkedHashSet<>(Set.of(response)));

        when(examAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));
        when(questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId))
            .thenReturn(Optional.of(response));

        BigDecimal autoScore = new BigDecimal("7.000");
        when(gradingService.grade(any(), any())).thenReturn(new GradingResult(autoScore, true));

        service.resetManualGrade(staffId, attemptId, questionId);

        verify(classroomAuthorizationService).requireManageGrades(classroom.getId(), staffId);
        assertFalse(response.isOverridden());
        assertEquals(autoScore, response.getScore());
        assertEquals(autoScore, attempt.getScore());
        assertEquals(ExamAttempt.Status.GRADED, attempt.getStatus());
        verify(questionResponseRepository).save(response);
        verify(examAttemptRepository).save(attempt);
    }

    @Test
    void shouldFailWhenManualGradeExceedsMaxPoints() {
        UUID requesterId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();
        BigDecimal maxPoints = new BigDecimal("10.000");
        BigDecimal excessiveScore = new BigDecimal("10.001");

        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).build();
        Exam exam = Exam.builder().id(UUID.randomUUID()).classroom(classroom).build();
        ExamAttempt attempt = ExamAttempt.builder()
            .id(attemptId)
            .exam(exam)
            .status(ExamAttempt.Status.SUBMITTED)
            .responses(new LinkedHashSet<>())
            .build();

        Question question = Question.builder()
            .id(questionId)
            .maxPoints(maxPoints)
            .build();

        QuestionResponse response = QuestionResponse.builder()
            .attempt(attempt)
            .question(question)
            .build();

        attempt.getResponses().add(response);

        when(examAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));
        when(questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId))
            .thenReturn(Optional.of(response));

        ManualGradeRequest request = ManualGradeRequest.builder()
            .score(excessiveScore)
            .build();

        assertThrows(IllegalArgumentException.class, () ->
            service.manualGradeQuestion(requesterId, attemptId, questionId, request)
        );
    }

    @Test
    void shouldFailWhenManualGradeIsNegative() {
        UUID requesterId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();
        BigDecimal maxPoints = new BigDecimal("10.000");
        BigDecimal negativeScore = new BigDecimal("-1.000");

        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).build();
        Exam exam = Exam.builder().id(UUID.randomUUID()).classroom(classroom).build();
        ExamAttempt attempt = ExamAttempt.builder()
            .id(attemptId)
            .exam(exam)
            .status(ExamAttempt.Status.SUBMITTED)
            .responses(new LinkedHashSet<>())
            .build();

        Question question = Question.builder()
            .id(questionId)
            .maxPoints(maxPoints)
            .build();

        QuestionResponse response = QuestionResponse.builder()
            .attempt(attempt)
            .question(question)
            .build();

        attempt.getResponses().add(response);

        when(examAttemptRepository.findById(attemptId)).thenReturn(Optional.of(attempt));
        when(questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId))
            .thenReturn(Optional.of(response));

        ManualGradeRequest request = ManualGradeRequest.builder()
            .score(negativeScore)
            .build();

        assertThrows(IllegalArgumentException.class, () ->
            service.manualGradeQuestion(requesterId, attemptId, questionId, request)
        );
    }

    private static ExamAttempt buildAttempt(UUID studentId) {
        UUID attemptId = UUID.randomUUID();
        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).build();
        Exam exam = Exam.builder().id(UUID.randomUUID()).classroom(classroom).build();
        return ExamAttempt.builder()
            .id(attemptId)
            .exam(exam)
            .student(User.builder().id(studentId).build())
            .status(ExamAttempt.Status.GRADED)
            .score(new BigDecimal("88.000"))
            .build();
    }
}

