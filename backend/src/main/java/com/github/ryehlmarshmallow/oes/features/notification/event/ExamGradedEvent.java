package com.github.ryehlmarshmallow.oes.features.notification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ExamGradedEvent extends ApplicationEvent {
    private final UUID examId;
    private final UUID classroomId;
    private final UUID attemptId;
    private final UUID studentId;
    private final String examTitle;

    public ExamGradedEvent(Object source, UUID examId, UUID classroomId, UUID attemptId, UUID studentId, String examTitle) {
        super(source);
        this.examId = examId;
        this.classroomId = classroomId;
        this.attemptId = attemptId;
        this.studentId = studentId;
        this.examTitle = examTitle;
    }
}
