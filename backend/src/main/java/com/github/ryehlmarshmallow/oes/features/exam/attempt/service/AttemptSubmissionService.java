package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.AttemptResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.FileDetails;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.FileDownloadResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.FileSubmissionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.SaveAnswerRequest;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.FileQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptAccessDeniedException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptNotFoundException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptNotInProgressException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.InvalidFileSubmissionException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.QuestionNotInAttemptException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.QuestionResponseRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.repository.ExamRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.FileQuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.QuestionContent;
import com.github.ryehlmarshmallow.oes.features.storage.config.StorageConfig;
import com.github.ryehlmarshmallow.oes.features.storage.entity.FileMetadata;
import com.github.ryehlmarshmallow.oes.features.storage.repository.FileMetadataRepository;
import com.github.ryehlmarshmallow.oes.features.storage.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AttemptSubmissionService {

    private final ExamAttemptRepository examAttemptRepository;
    private final QuestionResponseRepository questionResponseRepository;
    private final StorageService storageService;
    private final FileMetadataRepository fileMetadataRepository;
    private final StorageConfig storageConfig;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;
    private final AttemptGradeService attemptGradeService;

    public FileSubmissionResponse submitQuestionFiles(UUID userId, UUID attemptId, UUID questionId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new InvalidFileSubmissionException("At least one file is required");
        }

        ExamAttempt attempt = examAttemptRepository.findDetailedById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        if (attempt.getStudent() == null || attempt.getStudent().getId() == null || !attempt.getStudent().getId().equals(userId)) {
            throw new AttemptAccessDeniedException("You can only submit files for your own attempt");
        }
        if (attempt.getStatus() != ExamAttempt.Status.IN_PROGRESS) {
            throw new AttemptNotInProgressException("Cannot upload files to an attempt that is not in progress");
        }

        Instant now = Instant.now();
        Instant deadline = attempt.calculateDeadline();
        if (deadline != null && now.isAfter(deadline)) {
            throw new IllegalStateException("ATTEMPT_EXPIRED");
        }

        Question question = examAttemptRepository.findQuestionInAttempt(attemptId, questionId)
            .orElseThrow(() -> new QuestionNotInAttemptException("Question " + questionId + " is not part of this attempt"));

        if (question.getType() != QuestionType.FILE) {
            throw new InvalidFileSubmissionException("Question is not a file upload question: " + questionId);
        }

        FileQuestionContent content = resolveFileQuestionContent(question.getContent());

        QuestionResponse questionResponse = questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId)
            .orElseGet(() -> {
                QuestionResponse newResponse = QuestionResponse.builder()
                    .attempt(attempt)
                    .question(question)
                    .build();
                attempt.getResponses().add(newResponse);
                return newResponse;
            });

        List<FileDetails> existingFiles = extractExistingFiles(questionResponse.getData());
        int maxFileCount = resolveMaxFileCount(content);

        if (existingFiles.size() + files.size() > maxFileCount) {
            throw new InvalidFileSubmissionException(
                "File submission exceeds max file count of " + maxFileCount + " for this question"
            );
        }

        long maxFileSizeBytes = resolveMaxFileSizeBytes(content);
        Set<String> allowedExtensions = resolveAllowedExtensions(content);

        List<FileDetails> newlyStoredFiles = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                validateFile(file, maxFileSizeBytes, allowedExtensions);

                String fileId = storageService.store(storageConfig.getBucket(), file);
                FileDetails fileDetails = new FileDetails(fileId, file.getOriginalFilename());
                newlyStoredFiles.add(fileDetails);

                FileMetadata metadata = FileMetadata.builder()
                    .fileId(fileId)
                    .originalFilename(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .build();
                fileMetadataRepository.save(metadata);
            }
        } catch (RuntimeException ex) {
            for (FileDetails fileDetails : newlyStoredFiles) {
                try {
                    storageService.delete(storageConfig.getBucket(), fileDetails.fileId());
                    fileMetadataRepository.deleteById(fileDetails.fileId());
                } catch (RuntimeException _) {
                    // Best effort cleanup for partially stored submissions.
                }
            }
            throw ex;
        }

        List<FileDetails> combinedFiles = new ArrayList<>(existingFiles);
        combinedFiles.addAll(newlyStoredFiles);

        questionResponse.setData(new FileQuestionResponseData(combinedFiles));
        questionResponse.setScore(null);
        questionResponse.setGraded(false);
        questionResponseRepository.save(questionResponse);

        return new FileSubmissionResponse(
            attempt.getId(),
            questionId,
            newlyStoredFiles.size(),
            List.copyOf(combinedFiles)
        );
    }

    @Transactional(readOnly = true)
    public FileDownloadResponse downloadSubmittedFile(UUID requesterUserId, UUID attemptId, String fileId) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        boolean isStudentOwner = attempt.getStudent() != null &&
            attempt.getStudent().getId() != null &&
            attempt.getStudent().getId().equals(requesterUserId);

        if (!isStudentOwner) {
            UUID classroomId = attempt.getExam().getClassroom().getId();
            classroomAuthorizationService.requireManageGrades(classroomId, requesterUserId);
        }

        boolean fileExistsInAttempt = attempt.getResponses().stream()
            .filter(response -> response.getData() instanceof FileQuestionResponseData)
            .map(response -> (FileQuestionResponseData) response.getData())
            .anyMatch(fileData -> fileData.getFiles() != null && fileData.getFiles().stream().anyMatch(f -> f.fileId().equals(fileId)));

        if (!fileExistsInAttempt) {
            throw new AttemptAccessDeniedException("File does not belong to this attempt");
        }

        FileMetadata metadata = fileMetadataRepository.findById(fileId)
            .orElseThrow(() -> new IllegalArgumentException("File metadata not found"));

        InputStream inputStream = storageService.load(storageConfig.getBucket(), fileId);

        return new FileDownloadResponse(
            inputStream,
            metadata.getOriginalFilename(),
            metadata.getContentType()
        );
    }

    public AttemptResponse startAttempt(UUID userId, UUID examId) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // 1. One active attempt at a time
        if (examAttemptRepository.findFirstByExamIdAndStudentIdAndStatus(examId, userId, ExamAttempt.Status.IN_PROGRESS).isPresent()) {
            throw new IllegalStateException("You already have an active attempt for this exam");
        }

        // 2. Max attempts check & count
        long currentAttempts = examAttemptRepository.countByExamIdAndStudentId(examId, userId);
        if (exam.getMaxAttempts() != null && currentAttempts >= exam.getMaxAttempts()) {
            throw new IllegalStateException("Maximum attempts reached for this exam");
        }

        ExamAttempt attempt = ExamAttempt.builder()
            .exam(exam)
            .student(user)
            .attemptNumber((int) currentAttempts + 1)
            .status(ExamAttempt.Status.IN_PROGRESS)
            .startedAt(Instant.now())
            .lastActiveAt(Instant.now())
            .build();

        attempt = examAttemptRepository.save(attempt);
        return mapToResponse(attempt);
    }

    public AttemptResponse saveAnswer(UUID userId, UUID attemptId, SaveAnswerRequest request) {
        ExamAttempt attempt = examAttemptRepository.findDetailedById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        assertAttemptOwnership(attempt, userId);
        assertAttemptInProgress(attempt);

        Instant now = Instant.now();
        Instant deadline = attempt.calculateDeadline();
        if (deadline != null && now.isAfter(deadline)) {
            throw new IllegalStateException("ATTEMPT_EXPIRED");
        }

        Question question = examAttemptRepository.findQuestionInAttempt(attemptId, request.questionId())
            .orElseThrow(() -> new QuestionNotInAttemptException("Question " + request.questionId() + " is not part of this attempt"));

        QuestionResponse response = questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, request.questionId())
            .orElseGet(() -> {
                QuestionResponse newResponse = QuestionResponse.builder()
                    .attempt(attempt)
                    .question(question)
                    .build();
                attempt.getResponses().add(newResponse);
                return newResponse;
            });

        // Sequence number check
        if (response.getLastSequenceNumber() != null && request.sequenceNumber() <= response.getLastSequenceNumber()) {
            // Out of order request, ignore but return latest state
            return mapToResponse(attempt);
        }

        response.setData(request.answerData());
        response.setLastSequenceNumber(request.sequenceNumber());
        response.setGraded(false);
        response.setScore(null);

        // No need to explicitly save response if we save the attempt (cascade=ALL)
        // But saving both is safer for sequence number updates
        questionResponseRepository.save(response);

        attempt.setLastActiveAt(now);
        examAttemptRepository.save(attempt);

        return mapToResponse(attempt);
    }

    public AttemptResponse submitAttempt(UUID userId, UUID attemptId) {
        ExamAttempt attempt = examAttemptRepository.findDetailedById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        assertAttemptOwnership(attempt, userId);
        assertAttemptInProgress(attempt);

        attempt.setStatus(ExamAttempt.Status.SUBMITTED);
        attempt.setSubmittedAt(Instant.now());
        attempt.setLastActiveAt(Instant.now());

        attemptGradeService.autoGradeAttempt(attempt);

        return mapToResponse(examAttemptRepository.save(attempt));
    }

    public AttemptResponse heartbeat(UUID userId, UUID attemptId) {
        ExamAttempt attempt = examAttemptRepository.findById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        assertAttemptOwnership(attempt, userId);

        attempt.setLastActiveAt(Instant.now());
        examAttemptRepository.save(attempt);

        return mapToResponse(attempt);
    }

    @Transactional(readOnly = true)
    public List<AttemptResponse> getAttemptHistory(UUID userId, UUID examId) {
        return examAttemptRepository.findHistory(examId, userId).stream()
            .map(this::mapToResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AttemptResponse> getAllAttempts(UUID userId, UUID examId) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        classroomAuthorizationService.requireManageGrades(exam.getClassroom().getId(), userId);

        return examAttemptRepository.findByExamId(examId).stream()
            .map(this::mapToResponse)
            .toList();
    }

    public FileSubmissionResponse deleteQuestionFile(UUID userId, UUID attemptId, UUID questionId, String fileId) {
        ExamAttempt attempt = examAttemptRepository.findDetailedById(attemptId)
            .orElseThrow(() -> new AttemptNotFoundException("Attempt not found: " + attemptId));

        assertAttemptOwnership(attempt, userId);
        assertAttemptInProgress(attempt);

        Instant now = Instant.now();
        Instant deadline = attempt.calculateDeadline();
        if (deadline != null && now.isAfter(deadline)) {
            throw new IllegalStateException("ATTEMPT_EXPIRED");
        }

        Question question = examAttemptRepository.findQuestionInAttempt(attemptId, questionId)
            .orElseThrow(() -> new QuestionNotInAttemptException("Question " + questionId + " is not part of this attempt"));

        if (question.getType() != QuestionType.FILE) {
            throw new InvalidFileSubmissionException("Question is not a file upload question: " + questionId);
        }

        QuestionResponse questionResponse = questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId)
            .orElseThrow(() -> new InvalidFileSubmissionException("No response found for this question"));

        List<FileDetails> existingFiles = extractExistingFiles(questionResponse.getData());
        FileDetails fileToDelete = existingFiles.stream()
            .filter(f -> f.fileId().equals(fileId))
            .findFirst()
            .orElseThrow(() -> new InvalidFileSubmissionException("File ID not found in this submission"));

        existingFiles.remove(fileToDelete);
        questionResponse.setData(new FileQuestionResponseData(existingFiles));
        questionResponse.setScore(null);
        questionResponse.setGraded(false);
        questionResponseRepository.save(questionResponse);

        try {
            storageService.delete(storageConfig.getBucket(), fileId);
            fileMetadataRepository.deleteById(fileId);
        } catch (RuntimeException _) {
            // Best effort cleanup
        }

        return new FileSubmissionResponse(
            attempt.getId(),
            questionId,
            0,
            List.copyOf(existingFiles)
        );
    }

    private void assertAttemptOwnership(ExamAttempt attempt, UUID userId) {
        if (!attempt.getStudent().getId().equals(userId)) {
            throw new AttemptAccessDeniedException("You do not own this attempt");
        }
    }

    private void assertAttemptInProgress(ExamAttempt attempt) {
        if (attempt.getStatus() != ExamAttempt.Status.IN_PROGRESS) {
            throw new AttemptNotInProgressException("Attempt is not in progress");
        }
    }

    private AttemptResponse mapToResponse(ExamAttempt attempt) {
        String studentName = null;
        UUID studentId = null;
        if (attempt.getStudent() != null) {
            studentId = attempt.getStudent().getId();
            studentName = attempt.getStudent().getFirstName() + " " + attempt.getStudent().getLastName();
        }

        return new AttemptResponse(
            attempt.getId(),
            attempt.getAttemptNumber(),
            attempt.getStatus(),
            attempt.getStartedAt(),
            attempt.getSubmittedAt(),
            attempt.calculateDeadline(),
            Instant.now(),
            studentId,
            studentName
        );
    }

    private static FileQuestionContent resolveFileQuestionContent(QuestionContent content) {
        if (!(content instanceof FileQuestionContent fileQuestionContent)) {
            throw new InvalidFileSubmissionException("Question content is not FILE content");
        }
        return fileQuestionContent;
    }

    private static List<FileDetails> extractExistingFiles(QuestionResponseData data) {
        if (data == null) {
            return new ArrayList<>();
        }
        if (!(data instanceof FileQuestionResponseData fileData)) {
            throw new InvalidFileSubmissionException("Question response data is incompatible with FILE question");
        }
        return fileData.getFiles() == null ? new ArrayList<>() : new ArrayList<>(fileData.getFiles());
    }

    private int resolveMaxFileCount(FileQuestionContent content) {
        Integer questionLimit = content.getMaxFileCount();
        int defaultLimit = storageConfig.getMaxFileCount();

        if (questionLimit == null || questionLimit <= 0) {
            return defaultLimit;
        }

        return Math.min(questionLimit, defaultLimit);
    }

    private long resolveMaxFileSizeBytes(FileQuestionContent content) {
        Integer questionMegabytes = content.getMaxFileSizeMegabytes();
        long defaultBytes = storageConfig.getMaxFileSize().toBytes();

        if (questionMegabytes == null || questionMegabytes <= 0) {
            return defaultBytes;
        }

        long questionBytes = questionMegabytes * 1024L * 1024L;
        return Math.min(questionBytes, defaultBytes);
    }

    private Set<String> resolveAllowedExtensions(FileQuestionContent content) {
        List<String> questionAllowed = content.getAllowedExtensions();
        List<String> globalAllowed = storageConfig.getAllowedExtensions();

        if (questionAllowed == null || questionAllowed.isEmpty()) {
            return normalizeExtensions(globalAllowed);
        }

        Set<String> questionSet = normalizeExtensions(questionAllowed);
        Set<String> globalSet = normalizeExtensions(globalAllowed);
        questionSet.retainAll(globalSet);

        return questionSet;
    }

    private static Set<String> normalizeExtensions(List<String> extensions) {
        Set<String> normalized = new HashSet<>();
        if (extensions == null) {
            return normalized;
        }

        for (String extension : extensions) {
            if (!StringUtils.hasText(extension)) {
                continue;
            }
            String normalizedExtension = extension.trim().toLowerCase(Locale.ROOT);
            if (normalizedExtension.startsWith(".")) {
                normalizedExtension = normalizedExtension.substring(1);
            }
            normalized.add(normalizedExtension);
        }

        return normalized;
    }

    private static void validateFile(MultipartFile file, long maxFileSizeBytes, Set<String> allowedExtensions) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileSubmissionException("Uploaded file cannot be empty");
        }
        if (file.getSize() > maxFileSizeBytes) {
            throw new InvalidFileSubmissionException("File exceeds max size of " + maxFileSizeBytes + " bytes");
        }

        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
            throw new InvalidFileSubmissionException("File must include an extension");
        }

        String extension = StringUtils.getFilenameExtension(originalFilename);
        if (!StringUtils.hasText(extension)) {
            throw new InvalidFileSubmissionException("File extension is required");
        }

        String normalizedExtension = extension.toLowerCase(Locale.ROOT);
        if (!allowedExtensions.contains(normalizedExtension)) {
            throw new InvalidFileSubmissionException("File extension '" + extension + "' is not allowed for this question");
        }
    }
}

