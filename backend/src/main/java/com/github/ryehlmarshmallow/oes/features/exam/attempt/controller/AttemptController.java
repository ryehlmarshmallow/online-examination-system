package com.github.ryehlmarshmallow.oes.features.exam.attempt.controller;

import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.common.security.ratelimit.RateLimit;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptAnswersResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptGradeResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.FileDownloadResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.FileSubmissionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.ManualGradeRequest;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.SaveAnswerRequest;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.service.AttemptAnswerService;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.service.AttemptGradeService;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.service.AttemptSubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptSubmissionService attemptSubmissionService;
    private final AttemptAnswerService attemptAnswerService;
    private final AttemptGradeService attemptGradeService;

    @GetMapping("/attempts/{attemptId}/answers")
    public AttemptAnswersResponse getAttemptAnswers(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptAnswerService.getAttemptAnswers(userId, attemptId);
    }

    @GetMapping("/attempts/{attemptId}/grade")
    public AttemptGradeResponse getAttemptGrade(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptGradeService.getAttemptGrade(userId, attemptId);
    }

    @PutMapping("/attempts/{attemptId}/questions/{questionId}/grade")
    public ResponseEntity<Void> manualGradeQuestion(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId,
        @PathVariable UUID questionId,
        @Valid @RequestBody ManualGradeRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        attemptGradeService.manualGradeQuestion(userId, attemptId, questionId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/attempts/{attemptId}/questions/{questionId}/grade")
    public ResponseEntity<Void> resetManualGrade(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId,
        @PathVariable UUID questionId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        attemptGradeService.resetManualGrade(userId, attemptId, questionId);
        return ResponseEntity.ok().build();
    }

    @RateLimit(limit = 10, timeWindowSeconds = 60)
    @PostMapping(
        value = "/attempts/{attemptId}/questions/{questionId}/files",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @ResponseStatus(HttpStatus.CREATED)
    public FileSubmissionResponse submitFiles(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId,
        @PathVariable UUID questionId,
        @RequestPart("files") List<MultipartFile> files
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.submitQuestionFiles(userId, attemptId, questionId, files);
    }

    @DeleteMapping("/attempts/{attemptId}/questions/{questionId}/files/{fileId}")
    public FileSubmissionResponse deleteFile(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId,
        @PathVariable UUID questionId,
        @PathVariable String fileId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.deleteQuestionFile(userId, attemptId, questionId, fileId);
    }

    @GetMapping("/attempts/{attemptId}/files/{fileId}")
    public ResponseEntity<InputStreamResource> downloadFile(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId,
        @PathVariable String fileId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        FileDownloadResponse download = attemptSubmissionService.downloadSubmittedFile(userId, attemptId, fileId);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(download.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.filename() + "\"")
            .body(new InputStreamResource(download.inputStream()));
    }

    @RateLimit(limit = 5, timeWindowSeconds = 60)
    @PostMapping("/exams/{examId}/attempts")
    @ResponseStatus(HttpStatus.CREATED)
    public AttemptResponse startAttempt(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.startAttempt(userId, examId);
    }

    @PutMapping("/attempts/{attemptId}/save-answer")
    public AttemptResponse saveAnswer(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId,
        @Valid @RequestBody SaveAnswerRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.saveAnswer(userId, attemptId, request);
    }

    @RateLimit(limit = 5, timeWindowSeconds = 60)
    @PostMapping("/attempts/{attemptId}/submit")
    public AttemptResponse submitAttempt(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.submitAttempt(userId, attemptId);
    }

    @PostMapping("/attempts/{attemptId}/heartbeat")
    public AttemptResponse heartbeat(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID attemptId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.heartbeat(userId, attemptId);
    }

    @GetMapping("/exams/{examId}/attempts")
    public List<AttemptResponse> getAttemptHistory(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.getAttemptHistory(userId, examId);
    }

    @GetMapping("/exams/{examId}/all-attempts")
    public List<AttemptResponse> getAllAttempts(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID examId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return attemptSubmissionService.getAllAttempts(userId, examId);
    }

    private static UUID requireAuthenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null || userDetails.getUser().getId() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        return userDetails.getUser().getId();
    }
}
