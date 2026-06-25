package com.github.ryehlmarshmallow.oes.features.notification.service;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomMember;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.notification.entity.NotificationType;
import com.github.ryehlmarshmallow.oes.features.notification.event.ClassroomInvitationEvent;
import com.github.ryehlmarshmallow.oes.features.notification.event.ExamGradedEvent;
import com.github.ryehlmarshmallow.oes.features.notification.event.ExamPublishedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final ClassroomMemberRepository classroomMemberRepository;
    private final NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleExamPublished(ExamPublishedEvent event) {
        log.info("Handling ExamPublishedEvent asynchronously for exam: {}", event.getExamId());
        List<ClassroomMember> members = classroomMemberRepository
            .findByClassroomIdAndIsActiveTrueOrderByJoinedAtAsc(event.getClassroomId());

        for (ClassroomMember member : members) {
            if (member.getRole() == ClassroomRole.STUDENT) {
                String title = "New Exam Published";
                String message = String.format("A new exam '%s' has been published in your classroom '%s'.",
                    event.getExamTitle(), event.getClassroomName());
                Map<String, Object> metadata = Map.of(
                    "examId", event.getExamId().toString(),
                    "classroomId", event.getClassroomId().toString()
                );

                try {
                    notificationService.createNotification(
                        member.getUser().getId(),
                        title,
                        message,
                        NotificationType.EXAM_PUBLISHED,
                        metadata
                    );
                } catch (Exception ex) {
                    log.error("Failed to create exam published notification for user: {}", member.getUser().getId(), ex);
                }
            }
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleExamGraded(ExamGradedEvent event) {
        log.info("Handling ExamGradedEvent asynchronously for student: {}", event.getStudentId());
        String title = "Exam Graded";
        String message = String.format("Your submission for the exam '%s' has been graded.",
            event.getExamTitle());
        Map<String, Object> metadata = Map.of(
            "examId", event.getExamId().toString(),
            "classroomId", event.getClassroomId().toString(),
            "attemptId", event.getAttemptId().toString()
        );

        try {
            notificationService.createNotification(
                event.getStudentId(),
                title,
                message,
                NotificationType.EXAM_GRADED,
                metadata
            );
        } catch (Exception ex) {
            log.error("Failed to create exam graded notification for student: {}", event.getStudentId(), ex);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleClassroomInvitation(ClassroomInvitationEvent event) {
        log.info("Handling ClassroomInvitationEvent asynchronously for target user: {}", event.getTargetUserId());
        String title = "Classroom Invitation";
        String message = String.format("You have been invited by %s to join the classroom '%s'.",
            event.getInviterName(), event.getClassroomName());
        Map<String, Object> metadata = Map.of(
            "inviteId", event.getInviteId().toString(),
            "classroomId", event.getClassroomId().toString()
        );

        try {
            notificationService.createNotification(
                event.getTargetUserId(),
                title,
                message,
                NotificationType.CLASSROOM_INVITATION,
                metadata
            );
        } catch (Exception ex) {
            log.error("Failed to create classroom invitation notification for user: {}", event.getTargetUserId(), ex);
        }
    }
}
