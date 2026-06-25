package com.github.ryehlmarshmallow.oes.features.notification.event;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;

import java.util.UUID;

@Getter
public class ExamPublishedEvent extends ApplicationEvent {
    private final UUID examId;
    private final UUID classroomId;
    private final String examTitle;
    private final String classroomName;

    public ExamPublishedEvent(Object source, UUID examId, UUID classroomId, String examTitle, String classroomName) {
        super(source);
        this.examId = examId;
        this.classroomId = classroomId;
        this.examTitle = examTitle;
        this.classroomName = classroomName;
    }
}
