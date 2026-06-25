package com.github.ryehlmarshmallow.oes.features.exam.service;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomMember;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.common.exception.DomainBoundaryViolationException;
import com.github.ryehlmarshmallow.oes.features.questionset.util.SortOrderUtil;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.repository.ExamAttemptRepository;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.service.AttemptExpirationService;
import com.github.ryehlmarshmallow.oes.features.exam.dto.ExamQuestionGroupResponse;
import com.github.ryehlmarshmallow.oes.features.exam.dto.ExamQuestionResponse;
import com.github.ryehlmarshmallow.oes.features.exam.dto.ExamResponse;
import com.github.ryehlmarshmallow.oes.features.exam.dto.UpdateExamQuestionRequest;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.entity.ExamQuestionGroup;
import com.github.ryehlmarshmallow.oes.features.exam.entity.ExamStatus;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentAnswerVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.entity.StudentGradeVisibilityMode;
import com.github.ryehlmarshmallow.oes.features.exam.group.entity.ExamGroup;
import com.github.ryehlmarshmallow.oes.features.exam.group.repository.ExamGroupRepository;
import com.github.ryehlmarshmallow.oes.features.exam.repository.ExamRepository;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.ContentType;
import com.github.ryehlmarshmallow.oes.features.hierarchy.repository.HierarchyNodeRepository;
import com.github.ryehlmarshmallow.oes.features.notification.event.ExamPublishedEvent;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
import com.github.ryehlmarshmallow.oes.features.question.entity.QuestionType;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.MultipleChoiceQuestionContent;
import com.github.ryehlmarshmallow.oes.features.question.entity.content.SingleChoiceQuestionContent;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.QuestionGroupRequest;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.DomainType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.NodeType;
import com.github.ryehlmarshmallow.oes.features.questionset.repository.QuestionSetRepository;
import com.github.ryehlmarshmallow.oes.features.questionset.util.SortOrderUtil;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;


import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamService {

    private final ExamRepository examRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ClassroomRepository classroomRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;
    private final ExamGroupRepository examGroupRepository;
    private final HierarchyNodeRepository hierarchyNodeRepository;
    private final QuestionSetRepository questionSetRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final AttemptExpirationService attemptExpirationService;
    private final EntityManager entityManager;

    public ExamResponse createExam(
        UUID userId,
        UUID templateId,
        String title,
        UUID classroomId,
        StudentGradeVisibilityMode studentGradeVisibilityMode,
        StudentAnswerVisibilityMode studentAnswerVisibilityMode,
        Instant startTime,
        Instant endTime,
        Long duration,
        Integer maxAttempts,
        UUID groupId,
        UUID previousSiblingId
    ) {
        var templateNode = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(templateId, userId, DomainType.TEMPLATE)
            .orElseThrow(() -> new IllegalArgumentException("Exam template not found or access denied: " + templateId));

        if (templateNode.getNodeType() != NodeType.ITEM || templateNode.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Node is not an exam template");
        }

        var template = questionSetRepository.findDetailedByIdAndOwnerUserId(templateNode.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Template content missing"));

        Classroom classroom = classroomRepository.findById(classroomId)
            .orElseThrow(() -> new IllegalArgumentException("Classroom not found: " + classroomId));

        classroomAuthorizationService.assertCanManageExams(userId, classroom);

        Instant effectiveStartTime = resolveStartTime(startTime);
        validateTimeWindow(effectiveStartTime, endTime);

        String effectiveTitle = StringUtils.hasText(title) ? title : templateNode.getName();

        double orderIndex = allocateOrderIndex(classroomId, previousSiblingId);
        Exam exam = Exam.builder()
            .title(effectiveTitle)
            .classroom(classroom)
            .studentGradeVisibilityMode(resolveStudentGradeVisibilityMode(studentGradeVisibilityMode))
            .studentAnswerVisibilityMode(resolveStudentAnswerVisibilityMode(studentAnswerVisibilityMode))
            .startTime(effectiveStartTime)
            .endTime(endTime)
            .duration(duration != null ? Duration.ofSeconds(duration) : null)
            .maxAttempts(maxAttempts)
            .group(resolveGroup(classroomId, groupId))
            .orderIndex(orderIndex)
            .build();

        for (var templateGroup : template.getQuestionSetQuestionGroups()) {
            ExamQuestionGroup examGroup = ExamQuestionGroup.builder()
                .exam(exam)
                .questionGroup(templateGroup.getQuestionGroup().deepCopy())
                .orderIndex(templateGroup.getOrderIndex())
                .build();
            exam.getExamQuestionGroups().add(examGroup);
        }

        Exam savedExam = examRepository.save(exam);
        eventPublisher.publishEvent(new ExamPublishedEvent(
            this,
            savedExam.getId(),
            classroom.getId(),
            savedExam.getTitle(),
            classroom.getName()
        ));
        return toResponse(savedExam);
    }

    @Transactional(readOnly = true)
    public List<ExamResponse> listExamsByClassroom(UUID requesterUserId, UUID classroomId) {
        ClassroomMember member = classroomAuthorizationService.requireActiveMember(classroomId, requesterUserId);
        Instant now = Instant.now();

        return examRepository.findByClassroomIdOrderByOrderIndexAsc(classroomId).stream()
            .filter(exam -> member.getRole() != ClassroomRole.STUDENT || !isBeforeStart(now, exam))
            .map(exam -> toResponse(exam, now))
            .toList();
    }

    @Transactional(readOnly = true)
    public ExamResponse getExam(UUID requesterUserId, UUID examId) {
        Exam exam = examRepository.findDetailedById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        ClassroomMember member = classroomAuthorizationService.requireActiveMember(exam.getClassroom().getId(), requesterUserId);
        Instant now = Instant.now();
        if (member.getRole() == ClassroomRole.STUDENT && isBeforeStart(now, exam)) {
            throw new IllegalArgumentException("Exam is not visible to students");
        }

        return toResponse(exam, now);
    }

    public ExamResponse updateExam(
        UUID userId,
        UUID examId,
        String title,
        StudentGradeVisibilityMode studentGradeVisibilityMode,
        StudentAnswerVisibilityMode studentAnswerVisibilityMode,
        Instant startTime,
        Instant endTime,
        Long duration,
        Integer maxAttempts,
        UUID groupId
    ) {
        validateTitle(title);
        Instant effectiveStartTime = resolveStartTime(startTime);
        validateTimeWindow(effectiveStartTime, endTime);

        Exam exam = examRepository.findDetailedById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());
        exam.setTitle(title);
        exam.setStudentGradeVisibilityMode(resolveStudentGradeVisibilityMode(studentGradeVisibilityMode));
        exam.setStudentAnswerVisibilityMode(resolveStudentAnswerVisibilityMode(studentAnswerVisibilityMode));
        exam.setStartTime(effectiveStartTime);
        exam.setEndTime(endTime);
        exam.setDuration(duration != null ? Duration.ofSeconds(duration) : null);
        exam.setMaxAttempts(maxAttempts);
        exam.setGroup(resolveGroup(exam.getClassroom().getId(), groupId));

        Exam savedExam = examRepository.save(exam);
        attemptExpirationService.closeExpiredAttemptsForExam(savedExam);

        return toResponse(savedExam, Instant.now());
    }

    public ExamResponse updateExamQuestion(
        UUID userId,
        UUID examId,
        UUID questionId,
        UpdateExamQuestionRequest request
    ) {
        Exam exam = examRepository.findDetailedById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());

        var question = exam.getExamQuestionGroups().stream()
            .flatMap(g -> g.getQuestionGroup().getQuestions().stream())
            .filter(q -> q.getId().equals(questionId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Question not found in this exam: " + questionId));

        if (examAttemptRepository.existsByExamId(examId)) {
            // Defense: structural consistency check
            question.getContent().verifyStructuralConsistency(request.content());
            question.getRubric().verifyStructuralConsistency(request.rubric());
        }

        question.setPrompt(request.prompt());
        question.setMaxPoints(request.maxPoints());
        question.setContent(request.content());
        question.setRubric(request.rubric());
        question.setOrderIndex(request.orderIndex());

        entityManager.merge(question);
        return toResponse(exam, Instant.now());
    }

    public ExamResponse updateExamQuestions(UUID userId, UUID examId, List<QuestionGroupRequest> newGroups) {
        Exam exam = examRepository.findDetailedById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());

        List<ExamQuestionGroup> currentGroups = new ArrayList<>(exam.getExamQuestionGroups());
        if (currentGroups.size() != newGroups.size()) {
            throw new IllegalArgumentException("Cannot add or remove question groups in an exam");
        }

        for (int i = 0; i < currentGroups.size(); i++) {
            ExamQuestionGroup currentEg = currentGroups.get(i);
            QuestionGroupRequest newGroup = newGroups.get(i);

            var currentQg = currentEg.getQuestionGroup();
            currentQg.setPrompt(newGroup.prompt());
            currentQg.setGroup(newGroup.isGroup());

            List<Question> currentQs = new ArrayList<>(currentQg.getQuestions());
            var newQs = newGroup.questions();

            if (currentQs.size() != newQs.size()) {
                throw new IllegalArgumentException("Cannot add or remove questions in an exam group");
            }

            for (int j = 0; j < currentQs.size(); j++) {
                var currentQ = currentQs.get(j);
                var newQ = newQs.get(j);

                // Validation
                if (currentQ.getType() != newQ.type()) {
                    throw new IllegalArgumentException("Cannot change question type in an exam");
                }
                // verifyStructuralConsistency handles option count and IDs
                currentQ.getContent().verifyStructuralConsistency(newQ.content());
                currentQ.getRubric().verifyStructuralConsistency(newQ.rubric());

                // Update only allowed fields
                currentQ.setPrompt(newQ.prompt());

                // For choice questions, we update only the option texts
                if (currentQ.getType() == QuestionType.SINGLE_CHOICE) {
                    var currentContent = (SingleChoiceQuestionContent) currentQ.getContent();
                    var newContent = (SingleChoiceQuestionContent) newQ.content();
                    for (int k = 0; k < currentContent.getOptions().size(); k++) {
                        currentContent.getOptions().get(k).setText(newContent.getOptions().get(k).getText());
                    }
                    currentQ.setContent(currentContent);
                } else if (currentQ.getType() == QuestionType.MULTIPLE_CHOICE) {
                    var currentContent = (MultipleChoiceQuestionContent) currentQ.getContent();
                    var newContent = (MultipleChoiceQuestionContent) newQ.content();
                    for (int k = 0; k < currentContent.getOptions().size(); k++) {
                        currentContent.getOptions().get(k).setText(newContent.getOptions().get(k).getText());
                    }
                    currentQ.setContent(currentContent);
                }
                // For other types like ESSAY or FILE, only prompt was allowed anyway

                entityManager.merge(currentQ);
            }
            entityManager.merge(currentQg);
        }

        return toResponse(examRepository.save(exam), Instant.now());
    }

    public ExamResponse moveExam(UUID userId, UUID examId, UUID previousSiblingId) {
        Exam exam = examRepository.findById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());
        double orderIndex = allocateOrderIndex(exam.getClassroom().getId(), previousSiblingId, exam.getId());
        exam.setOrderIndex(orderIndex);
        return toResponse(examRepository.save(exam), Instant.now());
    }

    public void deleteExam(UUID userId, UUID examId) {
        Exam exam = examRepository.findDetailedById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());

        if (examAttemptRepository.existsByExamId(examId)) {
            throw new IllegalStateException("Cannot delete exam that already has attempts");
        }

        examRepository.delete(exam);
    }

    public List<ExamResponse> moveExamsToGroup(UUID userId, List<UUID> examIds, UUID groupId) {
        if (examIds == null || examIds.isEmpty()) {
            throw new IllegalArgumentException("examIds cannot be empty");
        }

        Set<UUID> uniqueIds = new LinkedHashSet<>(examIds);
        List<Exam> exams = uniqueIds.stream()
            .map(id -> examRepository.findDetailedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + id)))
            .toList();

        for (Exam exam : exams) {
            classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());

            if (groupId == null) {
                exam.setGroup(null);
                continue;
            }

            var group = examGroupRepository.findByIdAndClassroomId(groupId, exam.getClassroom().getId())
                .orElseThrow(() -> new IllegalArgumentException("Exam group not found: " + groupId));
            exam.setGroup(group);
        }

        return examRepository.saveAll(exams).stream().map(this::toResponse).toList();
    }

    private ExamGroup resolveGroup(UUID classroomId, UUID groupId) {
        if (groupId == null) {
            return null;
        }
        return examGroupRepository.findByIdAndClassroomId(groupId, classroomId)
            .orElseThrow(() -> new IllegalArgumentException("Exam group not found: " + groupId));
    }

    private static void validateTitle(String title) {
        if (!StringUtils.hasText(title)) {
            throw new IllegalArgumentException("Exam title cannot be empty");
        }
    }

    private static Instant resolveStartTime(Instant requestedStartTime) {
        return requestedStartTime == null ? Instant.now() : requestedStartTime;
    }

    private static void validateTimeWindow(Instant startTime, Instant endTime) {
        if (endTime != null && endTime.isBefore(startTime)) {
            throw new IllegalArgumentException("endTime cannot be before startTime");
        }
    }

    private static boolean isBeforeStart(Instant now, Exam exam) {
        Instant startTime = exam.getStartTime();
        return startTime != null && now.isBefore(startTime);
    }


    private static StudentGradeVisibilityMode resolveStudentGradeVisibilityMode(StudentGradeVisibilityMode mode) {
        if (mode == null) {
            return StudentGradeVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT;
        }
        return mode;
    }

    private static StudentAnswerVisibilityMode resolveStudentAnswerVisibilityMode(StudentAnswerVisibilityMode mode) {
        if (mode == null) {
            return StudentAnswerVisibilityMode.VIEW_AFTER_FINISHED_EACH_ATTEMPT;
        }
        return mode;
    }

    private static ExamStatus resolveStatus(Exam exam, Instant now) {
        if (isBeforeStart(now, exam)) {
            return ExamStatus.NOT_STARTED;
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            return ExamStatus.EXPIRED;
        }
        return ExamStatus.RUNNING;
    }

    private ExamResponse toResponse(Exam exam) {
        return toResponse(exam, Instant.now());
    }

    private ExamResponse toResponse(Exam exam, Instant now) {
        List<ExamQuestionGroupResponse> questionGroups = exam.getExamQuestionGroups().stream()
            .map(eg -> new ExamQuestionGroupResponse(
                eg.getId(),
                eg.getQuestionGroup().getPrompt(),
                eg.getQuestionGroup().isGroup(),
                eg.getQuestionGroup().getQuestions().stream()
                    .map(q -> new ExamQuestionResponse(
                        q.getId(),
                        q.getPrompt(),
                        q.getType(),
                        q.getMaxPoints(),
                        q.getContent(),
                        q.getRubric()
                    ))
                    .toList()
            ))
            .toList();

        return new ExamResponse(
            exam.getId(),
            exam.getTitle(),
            exam.getClassroom().getId(),
            exam.getGroup() == null ? null : exam.getGroup().getId(),
            exam.getExamQuestionGroups().size(),
            exam.getOrderIndex(),
            exam.getStudentGradeVisibilityMode(),
            exam.getStudentAnswerVisibilityMode(),
            exam.getStartTime(),
            exam.getEndTime(),
            exam.getDuration() != null ? exam.getDuration().getSeconds() : null,
            exam.getMaxAttempts(),
            resolveStatus(exam, now),
            questionGroups
        );
    }

    private double allocateOrderIndex(UUID classroomId, UUID previousSiblingId) {
        return allocateOrderIndex(classroomId, previousSiblingId, null);
    }

    private double allocateOrderIndex(UUID classroomId, UUID previousSiblingId, UUID currentExamId) {
        Exam previous = null;
        if (previousSiblingId != null) {
            if (previousSiblingId.equals(currentExamId)) {
                throw new DomainBoundaryViolationException("Exam cannot be placed relative to itself");
            }
            previous = examRepository.findByIdAndClassroomId(previousSiblingId, classroomId)
                .orElseThrow(() -> new DomainBoundaryViolationException(
                    "Previous sibling does not belong to the classroom"
                ));
        }

        Optional<Exam> next = findNextExam(classroomId, previous);
        Double prevIndex = previous == null ? null : previous.getOrderIndex();
        Double nextIndex = next.map(Exam::getOrderIndex).orElse(null);

        Optional<Double> allocated = SortOrderUtil.tryAllocate(prevIndex, nextIndex);
        if (allocated.isPresent()) {
            return allocated.get();
        }

        reindexClassroomExams(classroomId);
        UUID previousId = previous.getId();
        Exam refreshedPrev = examRepository.findByIdAndClassroomId(previousId, classroomId)
            .orElseThrow(() -> new DomainBoundaryViolationException(
                "Previous sibling does not belong to the classroom"
            ));
        Optional<Exam> refreshedNext = findNextExam(classroomId, refreshedPrev);
        Double refreshedNextIndex = refreshedNext.map(Exam::getOrderIndex).orElse(null);
        return SortOrderUtil.nextAfter(refreshedPrev.getOrderIndex(), refreshedNextIndex);
    }

    private Optional<Exam> findNextExam(UUID classroomId, Exam previous) {
        if (previous == null) {
            return examRepository.findFirstByClassroomIdOrderByOrderIndexAsc(classroomId);
        }
        return examRepository.findFirstByClassroomIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(
            classroomId,
            previous.getOrderIndex()
        );
    }

    private void reindexClassroomExams(UUID classroomId) {
        List<Exam> exams = examRepository.findByClassroomIdOrderByOrderIndexAsc(classroomId);
        double cursor = SortOrderUtil.DEFAULT_STRIDE;
        for (Exam exam : exams) {
            exam.setOrderIndex(cursor);
            cursor += SortOrderUtil.DEFAULT_STRIDE;
        }
        examRepository.saveAll(exams);
    }

    public Instant calculateDeadline(Instant startedAt, Duration duration, Instant endTime) {
        if (duration == null && endTime == null) {
            return null;
        }
        if (duration == null) {
            return endTime;
        }
        Instant relativeDeadline = startedAt.plus(duration);
        if (endTime == null) {
            return relativeDeadline;
        }
        return relativeDeadline.isBefore(endTime) ? relativeDeadline : endTime;
    }
}



