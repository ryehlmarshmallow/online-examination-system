package com.github.ryehlmarshmallow.oes.features.exam.controller;

import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.features.exam.dto.BulkMoveExamGroupRequest;
import com.github.ryehlmarshmallow.oes.features.exam.dto.CreateExamRequest;
import com.github.ryehlmarshmallow.oes.features.exam.dto.ExamResponse;
import com.github.ryehlmarshmallow.oes.features.exam.dto.MoveExamRequest;
import com.github.ryehlmarshmallow.oes.features.exam.dto.UpdateExamQuestionRequest;
import com.github.ryehlmarshmallow.oes.features.exam.dto.UpdateExamQuestionsRequest;
import com.github.ryehlmarshmallow.oes.features.exam.dto.UpdateExamRequest;
import com.github.ryehlmarshmallow.oes.features.exam.service.ExamService;
import com.github.ryehlmarshmallow.oes.features.questionset.service.QuestionSetService;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.SaveExamAsRequest;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionSetActionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final QuestionSetService questionSetService;

    @PostMapping("/exams")
    @ResponseStatus(HttpStatus.CREATED)
    public ExamResponse createExam(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody CreateExamRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.createExam(
            userId,
            request.templateId(),
            request.title(),
            request.classroomId(),
            request.studentGradeVisibilityMode(),
            request.studentAnswerVisibilityMode(),
            request.startTime(),
            request.endTime(),
            request.duration(),
            request.maxAttempts(),
            request.groupId(),
            request.previousSiblingId()
        );
    }

    @GetMapping("/classrooms/{classroomId}/exams")
    public List<ExamResponse> listClassroomExams(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.listExamsByClassroom(userId, classroomId);
    }

    @GetMapping("/exams/{examId}")
    public ExamResponse getExam(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.getExam(userId, examId);
    }

    @PutMapping("/exams/{examId}")
    public ExamResponse updateExam(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId,
        @Valid @RequestBody UpdateExamRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.updateExam(
            userId,
            examId,
            request.title(),
            request.studentGradeVisibilityMode(),
            request.studentAnswerVisibilityMode(),
            request.startTime(),
            request.endTime(),
            request.duration(),
            request.maxAttempts(),
            request.groupId()
        );
    }

    @PutMapping("/exams/{examId}/questions/{questionId}")
    public ExamResponse updateQuestion(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId,
        @PathVariable UUID questionId,
        @Valid @RequestBody UpdateExamQuestionRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.updateExamQuestion(userId, examId, questionId, request);
    }

    @PutMapping("/exams/{examId}/questions")
    public ExamResponse updateExamQuestions(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId,
        @Valid @RequestBody UpdateExamQuestionsRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.updateExamQuestions(userId, examId, request.questionGroups());
    }

    @PutMapping("/exams/{examId}/move")
    public ExamResponse moveExam(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId,
        @Valid @RequestBody MoveExamRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.moveExam(userId, examId, request.previousSiblingId());
    }

    @DeleteMapping("/exams/{examId}")
    public ResponseEntity<Void> deleteExam(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        examService.deleteExam(userId, examId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/exams/group-moves")
    public List<ExamResponse> moveExamsToGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody BulkMoveExamGroupRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examService.moveExamsToGroup(userId, request.examIds(), request.groupId());
    }

    @PostMapping("/exams/{examId}/save-as")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionSetActionResponse saveExamAs(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId,
        @Valid @RequestBody SaveExamAsRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        var node = questionSetService.saveExamAsQuestionSet(
            examId,
            request.targetDomain(),
            request.name(),
            request.parentId(),
            userId
        );
        return new QuestionSetActionResponse(node.getId());
    }

    private static UUID requireAuthenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null || userDetails.getUser().getId() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        return userDetails.getUser().getId();
    }
}
