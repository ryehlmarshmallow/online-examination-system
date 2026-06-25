package com.github.ryehlmarshmallow.oes.features.notification.service;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomMember;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.notification.entity.NotificationType;
import com.github.ryehlmarshmallow.oes.features.notification.event.ClassroomInvitationEvent;
import com.github.ryehlmarshmallow.oes.features.notification.event.ExamGradedEvent;
import com.github.ryehlmarshmallow.oes.features.notification.event.ExamPublishedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock
    private ClassroomMemberRepository classroomMemberRepository;

    @Mock
    private NotificationService notificationService;

    private NotificationEventListener notificationEventListener;

    @BeforeEach
    void setUp() {
        notificationEventListener = new NotificationEventListener(classroomMemberRepository, notificationService);
    }

    @Test
    void shouldHandleExamPublishedEventForStudents() {
        UUID classroomId = UUID.randomUUID();
        UUID examId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();
        UUID teacherId = UUID.randomUUID();

        User studentUser = User.builder().id(studentId).build();
        User teacherUser = User.builder().id(teacherId).build();

        ClassroomMember student = ClassroomMember.builder()
            .user(studentUser)
            .role(ClassroomRole.STUDENT)
            .build();
        ClassroomMember owner = ClassroomMember.builder()
            .user(teacherUser)
            .role(ClassroomRole.OWNER)
            .build();

        when(classroomMemberRepository.findByClassroomIdAndIsActiveTrueOrderByJoinedAtAsc(classroomId))
            .thenReturn(List.of(student, owner));

        ExamPublishedEvent event = new ExamPublishedEvent(this, examId, classroomId, "Midterm Exam", "Math 101");

        notificationEventListener.handleExamPublished(event);

        verify(notificationService).createNotification(
            eq(studentId),
            eq("New Exam Published"),
            contains("Midterm Exam"),
            eq(NotificationType.EXAM_PUBLISHED),
            eq(Map.of("examId", examId.toString(), "classroomId", classroomId.toString()))
        );

        // Owner should not get student notification
        verify(notificationService, never()).createNotification(
            eq(teacherId),
            anyString(),
            anyString(),
            any(NotificationType.class),
            any()
        );
    }

    @Test
    void shouldHandleExamGradedEvent() {
        UUID examId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();

        ExamGradedEvent event = new ExamGradedEvent(this, examId, classroomId, attemptId, studentId, "Midterm Exam");

        notificationEventListener.handleExamGraded(event);

        verify(notificationService).createNotification(
            eq(studentId),
            eq("Exam Graded"),
            contains("Midterm Exam"),
            eq(NotificationType.EXAM_GRADED),
            eq(Map.of("examId", examId.toString(), "classroomId", classroomId.toString(), "attemptId", attemptId.toString()))
        );
    }

    @Test
    void shouldHandleClassroomInvitationEvent() {
        UUID inviteId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();
        UUID targetUserId = UUID.randomUUID();

        ClassroomInvitationEvent event = new ClassroomInvitationEvent(
            this,
            inviteId,
            classroomId,
            targetUserId,
            "John Doe",
            "History 101"
        );

        notificationEventListener.handleClassroomInvitation(event);

        verify(notificationService).createNotification(
            eq(targetUserId),
            eq("Classroom Invitation"),
            eq("You have been invited by John Doe to join the classroom 'History 101'."),
            eq(NotificationType.CLASSROOM_INVITATION),
            eq(Map.of("inviteId", inviteId.toString(), "classroomId", classroomId.toString()))
        );
    }
}
