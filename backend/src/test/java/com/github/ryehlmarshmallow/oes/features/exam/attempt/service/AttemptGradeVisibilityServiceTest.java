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
class AttemptGradeVisibilityServiceTest {

    @Mock
    private ExamAttemptRepository examAttemptRepository;

    @Mock
    private ClassroomMemberRepository classroomMemberRepository;

    @Test
    void shouldNeverShowForNotViewAfterFinishedMode() {
        AttemptGradeVisibilityService service = new AttemptGradeVisibilityService(examAttemptRepository, classroomMemberRepository);
        ExamAttempt attempt = buildAttempt(StudentGradeVisibilityMode.NOT_VIEW_AFTER_FINISHED, ExamAttempt.Status.GRADED);

        assertFalse(service.canStudentViewOwnAttemptGrade(attempt));
    }

    @Test
    void shouldShowAfterFinishedForEachAttemptMode() {
        AttemptGradeVisibilityService service = new AttemptGradeVisibilityService(examAttemptRepository, classroomMemberRepository);
        ExamAttempt inProgress = buildAttempt(StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, ExamAttempt.Status.IN_PROGRESS);
        ExamAttempt submitted = buildAttempt(StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, ExamAttempt.Status.SUBMITTED);

        assertFalse(service.canStudentViewOwnAttemptGrade(inProgress));
        assertTrue(service.canStudentViewOwnAttemptGrade(submitted));
    }

    @Test
    void shouldRequireAllStudentsFinishedFirstAttemptForAllStudentsMode() {
        AttemptGradeVisibilityService service = new AttemptGradeVisibilityService(examAttemptRepository, classroomMemberRepository);

        UUID examId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();
        ExamAttempt submitted = buildAttempt(
            StudentGradeVisibilityMode.VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT,
            ExamAttempt.Status.SUBMITTED,
            examId,
            classroomId
        );

        when(classroomMemberRepository.countByClassroomIdAndRoleAndIsActiveTrue(classroomId, ClassroomRole.STUDENT)).thenReturn(3L);
        when(examAttemptRepository.countDistinctStudentIdByExamIdAndStatusIn(eq(examId), any())).thenReturn(2L, 3L);

        assertFalse(service.canStudentViewOwnAttemptGrade(submitted));
        assertTrue(service.canStudentViewOwnAttemptGrade(submitted));
    }

    @Test
    void shouldHideBeforeExamStartTime() {
        AttemptGradeVisibilityService service = new AttemptGradeVisibilityService(examAttemptRepository, classroomMemberRepository);
        ExamAttempt attempt = buildAttempt(StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, ExamAttempt.Status.GRADED);
        attempt.getExam().setStartTime(Instant.now().plusSeconds(60));

        assertFalse(service.canStudentViewOwnAttemptGrade(attempt));
    }

    private static ExamAttempt buildAttempt(StudentGradeVisibilityMode mode, ExamAttempt.Status status) {
        return buildAttempt(mode, status, UUID.randomUUID(), UUID.randomUUID());
    }

    private static ExamAttempt buildAttempt(
        StudentGradeVisibilityMode mode,
        ExamAttempt.Status status,
        UUID examId,
        UUID classroomId
    ) {
        Classroom classroom = Classroom.builder().id(classroomId).build();
        Exam exam = Exam.builder()
            .id(examId)
            .classroom(classroom)
            .studentGradeVisibilityMode(mode)
            .studentAnswerVisibilityMode(StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT)
            .startTime(Instant.now().minusSeconds(60))
            .endTime(Instant.now().plusSeconds(600))
            .build();
        return ExamAttempt.builder().id(UUID.randomUUID()).exam(exam).status(status).build();
    }
}

