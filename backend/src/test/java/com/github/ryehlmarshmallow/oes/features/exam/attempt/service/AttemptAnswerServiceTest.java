package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptAnswersResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.EssayQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptAccessDeniedException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttemptAnswerServiceTest {

    @Mock
    private ExamAttemptRepository examAttemptRepository;

    @Mock
    private ClassroomAuthorizationService classroomAuthorizationService;

    @Mock
    private AttemptAnswerVisibilityService attemptAnswerVisibilityService;

    @Mock
    private AttemptGradeVisibilityService attemptGradeVisibilityService;

    @Test
    void shouldHideRubricAndGradeForOwnerStudentWhenPolicySaysHidden() {
        AttemptAnswerService service = new AttemptAnswerService(
            examAttemptRepository,
            classroomAuthorizationService,
            attemptAnswerVisibilityService,
            attemptGradeVisibilityService
        );

        UUID studentId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(studentId);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));

        // Mock that student doesn't have staff permission
        doThrow(new IllegalArgumentException("forbidden"))
            .when(classroomAuthorizationService)
            .requireManageGrades(attempt.getExam().getClassroom().getId(), studentId);

        when(attemptAnswerVisibilityService.canStudentViewRubric(attempt)).thenReturn(false);
        when(attemptGradeVisibilityService.canStudentViewOwnAttemptGrade(attempt)).thenReturn(false);

        AttemptAnswersResponse response = service.getAttemptAnswers(studentId, attempt.getId());

        assertFalse(response.rubricVisible());
        assertFalse(response.gradeVisible());
        assertEquals(1, response.answers().size());
        assertNotNull(response.answers().get(0).answer());
        assertNull(response.answers().get(0).rubric());
        assertNull(response.answers().get(0).score());
        assertFalse(response.answers().get(0).graded());
        assertEquals("Rubric is hidden by exam policy", response.rubricHiddenReason());
        assertEquals("Grade is hidden by exam policy", response.gradeHiddenReason());
    }

    @Test
    void shouldExposeRubricAndGradeForOwnerStudentWhenVisible() {
        AttemptAnswerService service = new AttemptAnswerService(
            examAttemptRepository,
            classroomAuthorizationService,
            attemptAnswerVisibilityService,
            attemptGradeVisibilityService
        );

        UUID studentId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(studentId);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));

        // Mock that student doesn't have staff permission
        doThrow(new IllegalArgumentException("forbidden"))
            .when(classroomAuthorizationService)
            .requireManageGrades(attempt.getExam().getClassroom().getId(), studentId);

        when(attemptAnswerVisibilityService.canStudentViewRubric(attempt)).thenReturn(true);
        when(attemptGradeVisibilityService.canStudentViewOwnAttemptGrade(attempt)).thenReturn(true);

        AttemptAnswersResponse response = service.getAttemptAnswers(studentId, attempt.getId());

        assertTrue(response.rubricVisible());
        assertTrue(response.gradeVisible());
        assertEquals(1, response.answers().size());
        assertNotNull(response.answers().get(0).answer());
        assertNotNull(response.answers().get(0).score());
        assertTrue(response.answers().get(0).graded());
    }

    @Test
    void shouldAllowGradeManagersToSeeAll() {
        AttemptAnswerService service = new AttemptAnswerService(
            examAttemptRepository,
            classroomAuthorizationService,
            attemptAnswerVisibilityService,
            attemptGradeVisibilityService
        );

        UUID studentId = UUID.randomUUID();
        UUID staffId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(studentId);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));

        AttemptAnswersResponse response = service.getAttemptAnswers(staffId, attempt.getId());

        verify(classroomAuthorizationService).requireManageGrades(attempt.getExam().getClassroom().getId(), staffId);
        assertTrue(response.rubricVisible());
        assertTrue(response.gradeVisible());
        assertEquals(1, response.answers().size());
    }

    @Test
    void shouldHideAnswersForStaffMemberTestingTheirOwnInProgressAttempt() {
        AttemptAnswerService service = new AttemptAnswerService(
            examAttemptRepository,
            classroomAuthorizationService,
            attemptAnswerVisibilityService,
            attemptGradeVisibilityService
        );

        UUID staffId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(staffId);
        attempt.setStatus(ExamAttempt.Status.IN_PROGRESS);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));

        AttemptAnswersResponse response = service.getAttemptAnswers(staffId, attempt.getId());

        verify(classroomAuthorizationService).requireManageGrades(attempt.getExam().getClassroom().getId(), staffId);
        assertFalse(response.rubricVisible());
        assertFalse(response.gradeVisible());
        assertEquals("Rubric is hidden during attempt", response.rubricHiddenReason());
        assertEquals("Grade is hidden during attempt", response.gradeHiddenReason());
    }

    @Test
    void shouldRejectOtherUsersWithoutManageGradesPermission() {
        AttemptAnswerService service = new AttemptAnswerService(
            examAttemptRepository,
            classroomAuthorizationService,
            attemptAnswerVisibilityService,
            attemptGradeVisibilityService
        );

        UUID studentId = UUID.randomUUID();
        UUID otherId = UUID.randomUUID();
        ExamAttempt attempt = buildAttempt(studentId);
        when(examAttemptRepository.findDetailedById(attempt.getId())).thenReturn(Optional.of(attempt));
        doThrow(new IllegalArgumentException("forbidden"))
            .when(classroomAuthorizationService)
            .requireManageGrades(attempt.getExam().getClassroom().getId(), otherId);

        assertThrows(AttemptAccessDeniedException.class, () -> service.getAttemptAnswers(otherId, attempt.getId()));
    }

    private static ExamAttempt buildAttempt(UUID studentId) {
        Question question = Question.builder()
            .id(UUID.randomUUID())
            .type(QuestionType.ESSAY)
            .build();

        QuestionResponse response = QuestionResponse.builder()
            .question(question)
            .data(EssayQuestionResponseData.builder().answerText("answer").build())
            .score(new BigDecimal("80.000"))
            .isGraded(true)
            .build();

        Classroom classroom = Classroom.builder().id(UUID.randomUUID()).build();
        Exam exam = Exam.builder().id(UUID.randomUUID()).classroom(classroom).build();
        ExamAttempt attempt = ExamAttempt.builder()
            .id(UUID.randomUUID())
            .exam(exam)
            .student(User.builder().id(studentId).build())
            .status(ExamAttempt.Status.GRADED)
            .responses(Set.of(response))
            .build();
        response.setAttempt(attempt);
        return attempt;
    }
}

