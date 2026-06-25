package com.github.ryehlmarshmallow.oes.features.exam.attempt.service;

import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.FileDetails;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.dto.FileSubmissionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.ExamAttempt;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.impl.FileQuestionResponseData;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.entity.QuestionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.InvalidFileSubmissionException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.QuestionResponseRepository;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.entity.ExamQuestionGroup;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionGroup;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.EssayQuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.FileQuestionContent;
import com.github.ryehlmarshmallow.oes.features.storage.config.StorageConfig;
import com.github.ryehlmarshmallow.oes.features.storage.entity.FileMetadata;
import com.github.ryehlmarshmallow.oes.features.storage.repository.FileMetadataRepository;
import com.github.ryehlmarshmallow.oes.features.storage.service.StorageService;
import com.github.ryehlmarshmallow.oes.features.exam.repository.ExamRepository;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttemptSubmissionServiceTest {

    @Mock
    private ExamAttemptRepository examAttemptRepository;

    @Mock
    private QuestionResponseRepository questionResponseRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private FileMetadataRepository fileMetadataRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClassroomAuthorizationService classroomAuthorizationService;

    @Mock
    private AttemptGradeService attemptGradeService;

    @Captor
    private ArgumentCaptor<QuestionResponse> questionResponseCaptor;

    @Captor
    private ArgumentCaptor<FileMetadata> fileMetadataCaptor;

    private StorageConfig storageConfig;
    private AttemptSubmissionService attemptSubmissionService;

    @BeforeEach
    void setUp() {
        storageConfig = new StorageConfig();
        storageConfig.setMaxFileSize(DataSize.ofMegabytes(10));
        storageConfig.setMaxFileCount(5);
        storageConfig.setAllowedExtensions(List.of("pdf", "png"));

        attemptSubmissionService = new AttemptSubmissionService(
            examAttemptRepository,
            questionResponseRepository,
            storageService,
            fileMetadataRepository,
            storageConfig,
            examRepository,
            userRepository,
            classroomAuthorizationService,
            attemptGradeService
        );
    }

    @Test
    void shouldStoreFilesAndPersistQuestionResponseForFileQuestion() {
        UUID userId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();

        ExamAttempt attempt = attemptWithQuestion(userId, questionId, QuestionType.FILE);
        Question question = attempt.getExam().getExamQuestionGroups().iterator().next().getQuestionGroup().getQuestions().iterator().next();
        when(examAttemptRepository.findDetailedById(attemptId)).thenReturn(Optional.of(attempt));
        when(examAttemptRepository.findQuestionInAttempt(attemptId, questionId)).thenReturn(Optional.of(question));
        when(questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId)).thenReturn(Optional.empty());
        when(storageService.store(any(), any())).thenReturn("stored-file.pdf");
        when(questionResponseRepository.save(any(QuestionResponse.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
            "files",
            "answer.pdf",
            "application/pdf",
            "test-content".getBytes()
        );

        FileSubmissionResponse response = attemptSubmissionService.submitQuestionFiles(
            userId,
            attemptId,
            questionId,
            List.of(file)
        );

        assertEquals(1, response.uploadedCount());
        assertEquals(List.of(new FileDetails("stored-file.pdf", "answer.pdf")), response.files());

        verify(fileMetadataRepository).save(fileMetadataCaptor.capture());
        assertEquals("stored-file.pdf", fileMetadataCaptor.getValue().getFileId());

        verify(questionResponseRepository).save(questionResponseCaptor.capture());
        QuestionResponse savedResponse = questionResponseCaptor.getValue();
        assertInstanceOf(FileQuestionResponseData.class, savedResponse.getData());

        FileQuestionResponseData responseData = (FileQuestionResponseData) savedResponse.getData();
        assertEquals(List.of(new FileDetails("stored-file.pdf", "answer.pdf")), responseData.getFiles());
    }

    @Test
    void shouldRejectSubmissionForNonFileUploadQuestion() {
        UUID userId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();

        ExamAttempt attempt = attemptWithQuestion(userId, questionId, QuestionType.ESSAY);
        Question question = attempt.getExam().getExamQuestionGroups().iterator().next().getQuestionGroup().getQuestions().iterator().next();
        when(examAttemptRepository.findDetailedById(attemptId)).thenReturn(Optional.of(attempt));
        when(examAttemptRepository.findQuestionInAttempt(attemptId, questionId)).thenReturn(Optional.of(question));

        MockMultipartFile file = new MockMultipartFile(
            "files",
            "answer.pdf",
            "application/pdf",
            "test-content".getBytes()
        );

        InvalidFileSubmissionException ex = assertThrows(
            InvalidFileSubmissionException.class,
            () -> attemptSubmissionService.submitQuestionFiles(userId, attemptId, questionId, List.of(file))
        );

        assertEquals("Question is not a file upload question: " + questionId, ex.getMessage());
    }

    @Test
    void shouldRejectWhenSubmissionWouldExceedQuestionFileLimit() {
        UUID userId = UUID.randomUUID();
        UUID attemptId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();

        ExamAttempt attempt = attemptWithQuestion(userId, questionId, QuestionType.FILE);
        Question question = attempt.getExam().getExamQuestionGroups().iterator().next().getQuestionGroup().getQuestions().iterator().next();
        when(examAttemptRepository.findDetailedById(attemptId)).thenReturn(Optional.of(attempt));
        when(examAttemptRepository.findQuestionInAttempt(attemptId, questionId)).thenReturn(Optional.of(question));

        QuestionResponse existingResponse = QuestionResponse.builder()
            .attempt(attempt)
            .question(attempt.getExam().getExamQuestionGroups().iterator().next().getQuestionGroup().getQuestions().iterator().next())
            .data(new FileQuestionResponseData(new ArrayList<>(List.of(new FileDetails("a.pdf", "a.pdf"), new FileDetails("b.pdf", "b.pdf")))))
            .build();

        when(questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId)).thenReturn(Optional.of(existingResponse));

        MockMultipartFile file = new MockMultipartFile(
            "files",
            "answer.pdf",
            "application/pdf",
            "test-content".getBytes()
        );

        InvalidFileSubmissionException ex = assertThrows(
            InvalidFileSubmissionException.class,
            () -> attemptSubmissionService.submitQuestionFiles(userId, attemptId, questionId, List.of(file))
        );

        assertEquals("File submission exceeds max file count of 2 for this question", ex.getMessage());
    }

    private static ExamAttempt attemptWithQuestion(UUID userId, UUID questionId, QuestionType type) {
        Question question = Question.builder()
            .id(questionId)
            .type(type)
            .content(type == QuestionType.FILE
                ? FileQuestionContent.builder()
                .allowedExtensions(List.of("pdf"))
                .maxFileSizeMegabytes(2)
                .maxFileCount(2)
                .build()
                : EssayQuestionContent.builder().maxCharacters(500).build())
            .build();

        QuestionGroup group = QuestionGroup.builder()
            .questions(Set.of(question))
            .build();
        question.setGroup(group);

        Exam exam = Exam.builder()
            .examQuestionGroups(Set.of(ExamQuestionGroup.builder().questionGroup(group).build()))
            .build();

        return ExamAttempt.builder()
            .id(UUID.randomUUID())
            .exam(exam)
            .student(User.builder().id(userId).build())
            .status(ExamAttempt.Status.IN_PROGRESS)
            .responses(new LinkedHashSet<>())
            .build();
    }

    @Test
    void deleteQuestionFile_Success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();
        String fileIdToDelete = "file-1";

        ExamAttempt attempt = attemptWithQuestion(userId, questionId, QuestionType.FILE);
        UUID attemptId = attempt.getId();
        Question question = attempt.getExam().getExamQuestionGroups().iterator().next().getQuestionGroup().getQuestions().iterator().next();

        List<FileDetails> files = new ArrayList<>(List.of(new FileDetails("file-1", "file-1.pdf"), new FileDetails("file-2", "file-2.pdf")));
        QuestionResponse response = QuestionResponse.builder()
            .attempt(attempt)
            .question(question)
            .data(new FileQuestionResponseData(files))
            .build();

        when(examAttemptRepository.findDetailedById(attemptId)).thenReturn(Optional.of(attempt));
        when(examAttemptRepository.findQuestionInAttempt(attemptId, questionId)).thenReturn(Optional.of(question));
        when(questionResponseRepository.findFirstByAttemptIdAndQuestionIdOrderByLastSequenceNumberDesc(attemptId, questionId))
            .thenReturn(Optional.of(response));

        // Act
        FileSubmissionResponse result = attemptSubmissionService.deleteQuestionFile(userId, attemptId, questionId, fileIdToDelete);

        // Assert
        assertEquals(1, result.files().size());
        assertEquals("file-2", result.files().get(0).fileId());
        verify(questionResponseRepository).save(response);
        verify(storageService).delete(any(), any());
        verify(fileMetadataRepository).deleteById(fileIdToDelete);
    }
}

