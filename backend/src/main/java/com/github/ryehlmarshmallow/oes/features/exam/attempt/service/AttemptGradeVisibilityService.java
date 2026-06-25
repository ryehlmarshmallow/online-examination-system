package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentGradeVisibilityMode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.EnumSet;

@Service
@RequiredArgsConstructor
public class AttemptGradeVisibilityService {

    private static final EnumSet<ExamAttempt.Status> FINISHED_STATUSES = EnumSet.of(
        ExamAttempt.Status.SUBMITTED,
        ExamAttempt.Status.GRADED
    );

    private final ExamAttemptRepository examAttemptRepository;
    private final ClassroomMemberRepository classroomMemberRepository;

    public boolean canStudentViewOwnAttemptGrade(ExamAttempt attempt) {
        Instant startTime = attempt.getExam().getStartTime();
        if (startTime != null && Instant.now().isBefore(startTime)) {
            return false;
        }

        StudentGradeVisibilityMode mode = attempt.getExam().getStudentGradeVisibilityMode();
        if (mode == null) {
            mode = StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT;
        }

        return switch (mode) {
            case NOT_VIEW_AFTER_FINISHED -> false;
            case VIEW_AFTER_FINISHED_EACH_ATTEMPT -> isFinished(attempt);
            case VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT ->
                isFinished(attempt) && allStudentsFinishedFirstAttempt(attempt);
        };
    }

    private boolean allStudentsFinishedFirstAttempt(ExamAttempt attempt) {
        long studentCount = classroomMemberRepository.countByClassroomIdAndRoleAndIsActiveTrue(
            attempt.getExam().getClassroom().getId(),
            ClassroomRole.STUDENT
        );
        if (studentCount == 0) {
            return false;
        }

        long finishedStudents = examAttemptRepository.countDistinctStudentIdByExamIdAndStatusIn(
            attempt.getExam().getId(),
            FINISHED_STATUSES
        );
        return finishedStudents >= studentCount;
    }

    private static boolean isFinished(ExamAttempt attempt) {
        return FINISHED_STATUSES.contains(attempt.getStatus());
    }
}

