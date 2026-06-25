package com.github.ryehlmarshmallow.oes.features.exam.service;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.service.AttemptExpirationService;
import com.github.ryehlmarshmallow.oes.features.exam.dto.ExamResponse;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.entity.ExamStatus;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentAnswerVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentGradeVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.group.repository.ExamGroupRepository;
import com.github.ryehlmarshmallow.oes.features.exam.repository.ExamRepository;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.ContentType;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.HierarchyNode;
import com.github.ryehlmarshmallow.oes.features.hierarchy.repository.HierarchyNodeRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.DomainType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.NodeType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.QuestionSet;
import com.github.ryehlmarshmallow.oes.features.questionset.repository.QuestionSetRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExamServiceTest {

    @Mock
    private ExamRepository examRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private ExamService examService;

    @BeforeEach
    void setUp() {
        examService = new ExamService(
            examRepository,
            eventPublisher,
            classroomRepository,
            classroomAuthorizationService,
            examGroupRepository,
            hierarchyNodeRepository,
            questionSetRepository,
            examAttemptRepository,
            attemptExpirationService,
            entityManager
        );
    }

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private ClassroomAuthorizationService classroomAuthorizationService;

    @Mock
    private ExamGroupRepository examGroupRepository;

    @Mock
    private QuestionSetRepository questionSetRepository;

    @Mock
    private HierarchyNodeRepository hierarchyNodeRepository;

    @Mock
    private ExamAttemptRepository examAttemptRepository;

    @Mock
    private EntityManager entityManager;

    @Mock
    private AttemptExpirationService attemptExpirationService;

    @Captor
    private ArgumentCaptor<Exam> examCaptor;

    @Test
    void shouldCreateExamWhenRequesterOwnsClassroom() {
        UUID userId = UUID.randomUUID();
        UUID templateId = UUID.randomUUID();
        UUID contentId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();

        User owner = User.builder().id(userId).build();
        Classroom classroom = Classroom.builder().id(classroomId).createdBy(owner).build();

        QuestionSet templateContent = new QuestionSet();
        templateContent.setId(contentId);

        HierarchyNode templateNode = new HierarchyNode(
            "Midterm Template",
            NodeType.ITEM,
            DomainType.TEMPLATE,
            null,
            1.0d,
            owner
        );
        templateNode.setId(templateId);
        templateNode.setContent(templateContent);
        templateNode.setContentType(ContentType.QUESTION_SET);

        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(templateId, userId, DomainType.TEMPLATE)).thenReturn(Optional.of(templateNode));
        when(questionSetRepository.findDetailedByIdAndOwnerUserId(contentId, userId)).thenReturn(Optional.of(templateContent));
        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(examRepository.findFirstByClassroomIdOrderByOrderIndexAsc(classroomId)).thenReturn(Optional.empty());

        Instant startTime = Instant.now().plusSeconds(60);
        Instant endTime = startTime.plusSeconds(3_600);

        ExamResponse response = examService.createExam(
            userId,
            templateId,
            "Midterm",
            classroomId,
            StudentGradeVisibilityMode.NOT_VIEW_AFTER_FINISHED,
            StudentAnswerVisibilityMode.VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT,
            startTime,
            endTime,
            null,
            null,
            null,
            null
        );

        verify(examRepository).save(examCaptor.capture());
        Exam savedExam = examCaptor.getValue();

        assertEquals("Midterm", response.title());
        assertEquals(classroomId, response.classroomId());
        assertEquals(StudentGradeVisibilityMode.NOT_VIEW_AFTER_FINISHED, response.studentGradeVisibilityMode());
        assertEquals(
            StudentAnswerVisibilityMode.VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT,
            response.studentAnswerVisibilityMode()
        );
        assertEquals(startTime, response.startTime());
        assertEquals(endTime, response.endTime());
        assertEquals(ExamStatus.NOT_STARTED, response.status());
        assertEquals(1.0d, response.orderIndex());
        assertEquals("Midterm", savedExam.getTitle());
        assertEquals(classroomId, savedExam.getClassroom().getId());
        assertEquals(StudentGradeVisibilityMode.NOT_VIEW_AFTER_FINISHED, savedExam.getStudentGradeVisibilityMode());
        assertEquals(
            StudentAnswerVisibilityMode.VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT,
            savedExam.getStudentAnswerVisibilityMode()
        );
        assertEquals(startTime, savedExam.getStartTime());
        assertEquals(endTime, savedExam.getEndTime());
        verify(classroomAuthorizationService).assertCanManageExams(userId, classroom);
    }

    @Test
    void shouldRejectCreateWhenRequesterIsNotClassroomOwner() {
        UUID userId = UUID.randomUUID();
        UUID templateId = UUID.randomUUID();
        UUID contentId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();
        User owner = User.builder().id(UUID.randomUUID()).build();
        Classroom classroom = Classroom.builder().id(classroomId).createdBy(owner).build();

        QuestionSet templateContent = new QuestionSet();
        templateContent.setId(contentId);

        HierarchyNode templateNode = new HierarchyNode(
            "Quiz Template",
            NodeType.ITEM,
            DomainType.TEMPLATE,
            null,
            1.0d,
            User.builder().id(userId).build()
        );
        templateNode.setId(templateId);
        templateNode.setContent(templateContent);
        templateNode.setContentType(ContentType.QUESTION_SET);

        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(templateId, userId, DomainType.TEMPLATE)).thenReturn(Optional.of(templateNode));
        when(questionSetRepository.findDetailedByIdAndOwnerUserId(contentId, userId)).thenReturn(Optional.of(templateContent));
        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));

        doThrow(new IllegalArgumentException("You do not have permission to manage classroom exams"))
            .when(classroomAuthorizationService)
            .assertCanManageExams(any(UUID.class), eq(classroom));

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> examService.createExam(
                userId,
                templateId,
                "Quiz",
                classroomId,
                StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT,
                StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT,
                Instant.now(),
                Instant.now().plusSeconds(60),
                null,
                null,
                null,
                null
            )
        );

        assertEquals("You do not have permission to manage classroom exams", ex.getMessage());
    }

    @Test
    void shouldUpdateExamTitleWhenRequesterOwnsClassroom() {
        UUID userId = UUID.randomUUID();
        UUID examId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();

        User owner = User.builder().id(userId).build();
        Classroom classroom = Classroom.builder().id(classroomId).createdBy(owner).build();
        Exam exam = Exam.builder().id(examId).title("Old").classroom(classroom).build();
        exam.setStartTime(Instant.parse("2026-03-31T00:00:00Z"));
        exam.setEndTime(Instant.parse("2026-03-31T01:00:00Z"));

        when(examRepository.findDetailedById(examId)).thenReturn(Optional.of(exam));
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ExamResponse response = examService.updateExam(
            userId,
            examId,
            "New Title",
            StudentGradeVisibilityMode.VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT,
            StudentAnswerVisibilityMode.NOT_VIEW_AFTER_FINISHED,
            Instant.parse("2026-04-01T00:00:00Z"),
            Instant.parse("2026-04-01T02:00:00Z"),
            null,
            null,
            null
        );

        assertEquals("New Title", response.title());
        assertEquals(
            StudentGradeVisibilityMode.VIEW_AFTER_ALL_STUDENTS_FINISH_FIRST_ATTEMPT,
            response.studentGradeVisibilityMode()
        );
        assertEquals(StudentAnswerVisibilityMode.NOT_VIEW_AFTER_FINISHED, response.studentAnswerVisibilityMode());
        assertEquals(Instant.parse("2026-04-01T00:00:00Z"), response.startTime());
        assertEquals(Instant.parse("2026-04-01T02:00:00Z"), response.endTime());
        verify(classroomAuthorizationService).assertCanManageExams(userId, classroom);
    }

    @Test
    void shouldDefaultVisibilityModeWhenNullProvided() {
        UUID userId = UUID.randomUUID();
        UUID templateId = UUID.randomUUID();
        UUID contentId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();

        User owner = User.builder().id(userId).build();
        Classroom classroom = Classroom.builder().id(classroomId).createdBy(owner).build();

        QuestionSet templateContent = new QuestionSet();
        templateContent.setId(contentId);

        HierarchyNode templateNode = new HierarchyNode(
            "Default Template",
            NodeType.ITEM,
            DomainType.TEMPLATE,
            null,
            1.0d,
            owner
        );
        templateNode.setId(templateId);
        templateNode.setContent(templateContent);
        templateNode.setContentType(ContentType.QUESTION_SET);

        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(templateId, userId, DomainType.TEMPLATE)).thenReturn(Optional.of(templateNode));
        when(questionSetRepository.findDetailedByIdAndOwnerUserId(contentId, userId)).thenReturn(Optional.of(templateContent));
        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(examRepository.findFirstByClassroomIdOrderByOrderIndexAsc(classroomId)).thenReturn(Optional.empty());

        Instant before = Instant.now();
        ExamResponse response = examService.createExam(
            userId,
            templateId,
            "Default Mode Exam",
            classroomId,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null
        );
        Instant after = Instant.now();

        assertEquals(StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, response.studentGradeVisibilityMode());
        assertEquals(StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT, response.studentAnswerVisibilityMode());
        assertNotNull(response.startTime());
        assertFalse(response.startTime().isBefore(before));
        assertFalse(response.startTime().isAfter(after));
        assertNull(response.endTime());
        assertEquals(ExamStatus.RUNNING, response.status());
    }

    @Test
    void shouldRejectInvalidTimeWindow() {
        UUID userId = UUID.randomUUID();
        UUID templateId = UUID.randomUUID();
        UUID contentId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();

        QuestionSet templateContent = new QuestionSet();
        templateContent.setId(contentId);

        HierarchyNode templateNode = new HierarchyNode(
            "Broken Template",
            NodeType.ITEM,
            DomainType.TEMPLATE,
            null,
            1.0d,
            User.builder().id(userId).build()
        );
        templateNode.setId(templateId);
        templateNode.setContent(templateContent);
        templateNode.setContentType(ContentType.QUESTION_SET);

        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(templateId, userId, DomainType.TEMPLATE)).thenReturn(Optional.of(templateNode));
        when(questionSetRepository.findDetailedByIdAndOwnerUserId(contentId, userId)).thenReturn(Optional.of(templateContent));
        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(Classroom.builder().id(classroomId).build()));

        IllegalArgumentException ex = assertThrows(
            IllegalArgumentException.class,
            () -> examService.createExam(
                userId,
                templateId,
                "Broken",
                classroomId,
                null,
                null,
                Instant.parse("2026-04-01T10:00:00Z"),
                Instant.parse("2026-04-01T09:00:00Z"),
                null,
                null,
                null,
                null
            )
        );

        assertEquals("endTime cannot be before startTime", ex.getMessage());
    }
}

