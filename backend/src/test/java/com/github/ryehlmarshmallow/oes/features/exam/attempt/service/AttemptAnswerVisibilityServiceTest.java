package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentAnswerVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentGradeVisibilityMode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttemptAnswerVisibilityServiceTest {

    @Mock
    private ExamAttemptRepository examAttemptRepository;

    @Mock
    private ClassroomMemberRepository classroomMemberRepository;

    @Test
    void shouldNeverShowForNotViewAfterFinishedMode() {
        AttemptAnswerVisibilityService service = new AttemptAnswerVisibilityService(examAttemptRepository, classroomMemberRepository);
        ExamAttempt attempt = buildAttempt(StudentAnswerVisibilityMode.NOT_VIEW_AFTER_FINISHED, ExamAttempt.Status.GRADED);

        assertFalse(service.canStudentViewRubric(attempt));
    }

    @Test
    void shouldShowAfterFinishedForEachAttemptMode() {
        AttemptAnswerVisibilityService service = new AttemptAnswerVisibilityService(examAttemptRepository, classroomMemberRepository);
        ExamAttempt inProgress = buildAttempt(StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, ExamAttempt.Status.IN_PROGRESS);
        ExamAttempt submitted = buildAttempt(StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, ExamAttempt.Status.SUBMITTED);

        assertFalse(service.canStudentViewRubric(inProgress));
        assertTrue(service.canStudentViewRubric(submitted));
    }

    @Test
    void shouldRequireAllStudentsFinishedFirstAttemptForAllStudentsMode() {
        AttemptAnswerVisibilityService service = new AttemptAnswerVisibilityService(examAttemptRepository, classroomMemberRepository);

        UUID examId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();
        ExamAttempt submitted = buildAttempt(
            StudentAnswerVisibilityMode.VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT,
            ExamAttempt.Status.SUBMITTED,
            examId,
            classroomId
        );

        when(classroomMemberRepository.countByClassroomIdAndRoleAndIsActiveTrue(classroomId, ClassroomRole.STUDENT)).thenReturn(2L);
        when(examAttemptRepository.countDistinctStudentIdByExamIdAndStatusIn(eq(examId), any())).thenReturn(1L, 2L);

        assertFalse(service.canStudentViewRubric(submitted));
        assertTrue(service.canStudentViewRubric(submitted));
    }

    @Test
    void shouldHideBeforeExamStartTime() {
        AttemptAnswerVisibilityService service = new AttemptAnswerVisibilityService(examAttemptRepository, classroomMemberRepository);
        ExamAttempt attempt = buildAttempt(StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, ExamAttempt.Status.GRADED);
        attempt.getExam().setStartTime(Instant.now().plusSeconds(60));

        assertFalse(service.canStudentViewRubric(attempt));
    }

    private static ExamAttempt buildAttempt(StudentAnswerVisibilityMode mode, ExamAttempt.Status status) {
        return buildAttempt(mode, status, UUID.randomUUID(), UUID.randomUUID());
    }

    private static ExamAttempt buildAttempt(
        StudentAnswerVisibilityMode mode,
        ExamAttempt.Status status,
        UUID examId,
        UUID classroomId
    ) {
        Classroom classroom = Classroom.builder().id(classroomId).build();
        Exam exam = Exam.builder()
            .id(examId)
            .classroom(classroom)
            .studentGradeVisibilityMode(StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT)
            .studentAnswerVisibilityMode(mode)
            .startTime(Instant.now().minusSeconds(60))
            .endTime(Instant.now().plusSeconds(600))
            .build();
        return ExamAttempt.builder().id(UUID.randomUUID()).exam(exam).status(status).build();
    }
}

