package com.github.ryehlmarshmallow.oes.features.questionset.service;

import com.github.ryehlmarshmallow.oes.common.exception.DomainBoundaryViolationException;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.repository.ExamRepository;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.ContentType;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.HierarchyNode;
import com.github.ryehlmarshmallow.oes.features.hierarchy.repository.HierarchyNodeRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionGroup;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.NodeResponse;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionGroupRequest;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionRequest;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionSetDetailResponse;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.SyncQuestionSetRequest;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.DomainType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.NodeType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.QuestionSet;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.QuestionSetQuestionGroup;
import com.github.ryehlmarshmallow.oes.features.questionset.repository.QuestionSetRepository;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.QuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.impl.ManualRubric;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import jakarta.persistence.EntityManager;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionSetServiceTest {

    @Mock
    private HierarchyNodeRepository hierarchyNodeRepository;

    @Mock
    private QuestionSetRepository questionSetRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private ClassroomAuthorizationService classroomAuthorizationService;

    @Mock
    private EntityManager entityManager;

    private QuestionSetService questionSetService;

    @BeforeEach
    void setUp() {
        questionSetService = new QuestionSetService(
            hierarchyNodeRepository,
            questionSetRepository,
            userRepository,
            examRepository,
            classroomRepository,
            classroomAuthorizationService,
            entityManager
        );
    }

    @Test
    void shouldCreateFolderNodeSuccessfully() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(hierarchyNodeRepository.findTypeSpecificSiblings(userId, DomainType.POOL, null, NodeType.FOLDER))
            .thenReturn(Collections.emptyList());

        HierarchyNode savedNode = new HierarchyNode("Test Folder", NodeType.FOLDER, DomainType.POOL, null, 1.0, user);
        savedNode.setId(UUID.randomUUID());
        when(hierarchyNodeRepository.save(any(HierarchyNode.class))).thenReturn(savedNode);

        HierarchyNode result = questionSetService.createNode(userId, DomainType.POOL, "Test Folder", NodeType.FOLDER, null);

        assertNotNull(result);
        assertEquals("Test Folder", result.getName());
        assertEquals(NodeType.FOLDER, result.getNodeType());
        verify(hierarchyNodeRepository, atLeastOnce()).save(any(HierarchyNode.class));
    }

    @Test
    void shouldCreateItemNodeWithQuestionSet() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(hierarchyNodeRepository.findTypeSpecificSiblings(userId, DomainType.POOL, null, NodeType.ITEM))
            .thenReturn(Collections.emptyList());

        HierarchyNode savedNode = new HierarchyNode("Test Item", NodeType.ITEM, DomainType.POOL, null, 1.0, user);
        savedNode.setId(UUID.randomUUID());
        savedNode.setContent(new QuestionSet());
        savedNode.setContentType(ContentType.QUESTION_SET);
        when(hierarchyNodeRepository.save(any(HierarchyNode.class))).thenReturn(savedNode);

        HierarchyNode result = questionSetService.createNode(userId, DomainType.POOL, "Test Item", NodeType.ITEM, null);

        assertNotNull(result);
        assertEquals("Test Item", result.getName());
        assertEquals(NodeType.ITEM, result.getNodeType());
        assertEquals(ContentType.QUESTION_SET, result.getContentType());
        assertNotNull(result.getContent());
    }

    @Test
    void shouldThrowExceptionWhenCreatingNodeWithEmptyName() {
        UUID userId = UUID.randomUUID();
        assertThrows(IllegalArgumentException.class, () ->
            questionSetService.createNode(userId, DomainType.POOL, "", NodeType.FOLDER, null)
        );
    }

    @Test
    void shouldRenameNodeSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID nodeId = UUID.randomUUID();
        HierarchyNode node = new HierarchyNode("Old Name", NodeType.FOLDER, DomainType.POOL, null, 1.0, null);
        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(nodeId, userId, DomainType.POOL))
            .thenReturn(Optional.of(node));
        when(hierarchyNodeRepository.save(any(HierarchyNode.class))).thenAnswer(inv -> inv.getArgument(0));

        NodeResponse result = questionSetService.renameNode(userId, DomainType.POOL, nodeId, "New Name");

        assertEquals("New Name", result.name());
    }

    @Test
    void shouldUpdateQuestionsSuccessfully() {
        UUID userId = UUID.randomUUID();
        UUID setId = UUID.randomUUID();
        QuestionSet questionSet = new QuestionSet();
        HierarchyNode node = new HierarchyNode("Set Node", NodeType.ITEM, DomainType.POOL, null, 1.0, null);
        node.setId(setId);
        node.setContent(questionSet);
        node.setContentType(ContentType.QUESTION_SET);

        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(setId, userId, DomainType.POOL))
            .thenReturn(Optional.of(node));
        when(questionSetRepository.findDetailedByIdAndOwnerUserId(questionSet.getId(), userId))
            .thenReturn(Optional.of(questionSet));

        QuestionContent mockContent = mock(QuestionContent.class);
        Rubric mockRubric = new ManualRubric(QuestionType.SINGLE_CHOICE);
        QuestionRequest qReq = new QuestionRequest("Q Prompt", QuestionType.SINGLE_CHOICE, BigDecimal.TEN, mockContent, mockRubric);
        QuestionGroupRequest qgReq = new QuestionGroupRequest("Group Prompt", true, List.of(qReq));
        SyncQuestionSetRequest syncRequest = new SyncQuestionSetRequest(List.of(qgReq));

        questionSetService.updateQuestions(userId, DomainType.POOL, setId, syncRequest);

        assertEquals(1, questionSet.getQuestionSetQuestionGroups().size());
        QuestionSetQuestionGroup qsqg = questionSet.getQuestionSetQuestionGroups().iterator().next();
        assertEquals("Group Prompt", qsqg.getQuestionGroup().getPrompt());
        assertTrue(qsqg.getQuestionGroup().isGroup());
        assertEquals(1, qsqg.getQuestionGroup().getQuestions().size());
        assertEquals("Q Prompt", qsqg.getQuestionGroup().getQuestions().iterator().next().getPrompt());
    }

    @Test
    void shouldGetQuestionSetDetail() {
        UUID userId = UUID.randomUUID();
        UUID setId = UUID.randomUUID();
        QuestionSet questionSet = new QuestionSet();
        QuestionGroup group = QuestionGroup.builder().prompt("Prompt").isGroup(true).questions(new LinkedHashSet<>()).build();
        QuestionSetQuestionGroup qsqg = new QuestionSetQuestionGroup(questionSet, group, 0);
        questionSet.getQuestionSetQuestionGroups().add(qsqg);

        HierarchyNode node = new HierarchyNode("Set Node", NodeType.ITEM, DomainType.POOL, null, 1.0, null);
        node.setId(setId);
        node.setContent(questionSet);
        node.setContentType(ContentType.QUESTION_SET);

        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(setId, userId, DomainType.POOL))
            .thenReturn(Optional.of(node));
        when(questionSetRepository.findDetailedByIdAndOwnerUserId(questionSet.getId(), userId))
            .thenReturn(Optional.of(questionSet));

        QuestionSetDetailResponse result = questionSetService.getQuestionSetDetail(userId, DomainType.POOL, setId);

        assertNotNull(result);
        assertEquals(node.getId(), result.id());
        assertEquals(1, result.questionGroups().size());
        assertEquals("Prompt", result.questionGroups().get(0).prompt());
    }

    @Test
    void shouldGenerateRandomExamFromPool() {
        UUID userId = UUID.randomUUID();
        UUID poolId = UUID.randomUUID();
        UUID classroomId = UUID.randomUUID();

        QuestionSet pool = new QuestionSet();
        QuestionGroup group = QuestionGroup.builder().prompt("Q1").isGroup(false).questions(new LinkedHashSet<>()).build();
        QuestionSetQuestionGroup qsqg = new QuestionSetQuestionGroup(pool, group, 0);
        pool.getQuestionSetQuestionGroups().add(qsqg);

        HierarchyNode node = new HierarchyNode("Pool Node", NodeType.ITEM, DomainType.POOL, null, 1.0, null);
        node.setId(poolId);
        node.setContent(pool);
        node.setContentType(ContentType.QUESTION_SET);

        Classroom classroom = Classroom.builder().id(classroomId).build();

        when(hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(poolId, userId, DomainType.POOL))
            .thenReturn(Optional.of(node));
        when(questionSetRepository.findDetailedByIdAndOwnerUserId(pool.getId(), userId))
            .thenReturn(Optional.of(pool));
        when(classroomRepository.findById(classroomId)).thenReturn(Optional.of(classroom));
        when(examRepository.findByClassroomIdOrderByOrderIndexAsc(classroomId)).thenReturn(Collections.emptyList());
        when(examRepository.save(any(Exam.class))).thenAnswer(inv -> inv.getArgument(0));

        Exam exam = questionSetService.generateRandomExamFromPool(
            poolId, classroomId, "Final Exam", 0, Instant.now(), null, 3600, 1, userId
        );

        assertNotNull(exam);
        assertEquals("Final Exam", exam.getTitle());
        assertEquals(classroom, exam.getClassroom());
        assertEquals(1, exam.getExamQuestionGroups().size());
        verify(classroomAuthorizationService).assertCanManageExams(userId, classroom);
    }
}
