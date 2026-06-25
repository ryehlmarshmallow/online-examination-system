package com.github.ryehlmarshmallow.oes.features.questionset.service;

import com.github.ryehlmarshmallow.oes.common.exception.ContentTooLargeException;
import com.github.ryehlmarshmallow.oes.common.exception.DomainBoundaryViolationException;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.entity.ExamQuestionGroup;
import com.github.ryehlmarshmallow.oes.features.exam.repository.ExamRepository;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.ContentType;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.HierarchyNode;
import com.github.ryehlmarshmallow.oes.features.hierarchy.repository.HierarchyNodeRepository;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import com.github.ryehlmarshmallow.oes.features.question.entity.Question;
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
import com.github.ryehlmarshmallow.oes.features.questionset.util.SortOrderUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import jakarta.persistence.EntityManager;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class QuestionSetService {

    private static final int MAX_COPY_OR_DELETE_ITEMS = 1_000;

    private final HierarchyNodeRepository hierarchyNodeRepository;
    private final QuestionSetRepository questionSetRepository;
    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;
    private final EntityManager entityManager;

    public void updateQuestions(UUID userId, DomainType domainType, UUID setId, SyncQuestionSetRequest request) {
        HierarchyNode node = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(setId, userId, domainType)
            .orElseThrow(() -> new IllegalArgumentException("Question set not found or access denied: " + setId));

        if (node.getNodeType() != NodeType.ITEM || node.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Node is not a question set");
        }

        QuestionSet set = questionSetRepository.findDetailedByIdAndOwnerUserId(node.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Question set content not found for node: " + setId));

        set.getQuestionSetQuestionGroups().clear();

        int groupOrderIndex = 0;
        for (QuestionGroupRequest groupRequest : request.questionGroups()) {
            if (!groupRequest.isGroup()) {
                if (groupRequest.questions().size() != 1) {
                    throw new IllegalArgumentException("Standalone question must have exactly one item");
                }
                if (groupRequest.prompt() != null && !groupRequest.prompt().trim().isEmpty()) {
                    throw new IllegalArgumentException("Standalone question cannot have a section prompt");
                }
            }

            QuestionGroup group = QuestionGroup.builder()
                .prompt(groupRequest.prompt() == null ? "" : groupRequest.prompt())
                .isGroup(groupRequest.isGroup())
                .build();

            int questionOrderIndex = 0;
            for (QuestionRequest qRequest : groupRequest.questions()) {
                Question question = Question.builder()
                    .group(group)
                    .type(qRequest.type())
                    .prompt(qRequest.prompt())
                    .maxPoints(qRequest.points())
                    .content(qRequest.content())
                    .rubric(qRequest.rubric())
                    .orderIndex(questionOrderIndex++)
                    .build();
                group.getQuestions().add(question);
            }

            set.getQuestionSetQuestionGroups().add(
                new QuestionSetQuestionGroup(set, group, groupOrderIndex++)
            );
        }

        node.markModified();
        if (node.getParent() != null) {
            node.getParent().markModified();
        }
        hierarchyNodeRepository.save(node);
    }

    public QuestionSetDetailResponse getQuestionSetDetail(UUID userId, DomainType domainType, UUID setId) {
        HierarchyNode node = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(setId, userId, domainType)
            .orElseThrow(() -> new IllegalArgumentException("Node not found or access denied: " + setId));

        if (node.getNodeType() != NodeType.ITEM || node.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Node is not a question set");
        }

        QuestionSet set = questionSetRepository.findDetailedByIdAndOwnerUserId(node.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Question set content not found for node: " + setId));

        List<QuestionGroupRequest> groupResponses = set.getQuestionSetQuestionGroups().stream()
            .sorted(Comparator.comparing(QuestionSetQuestionGroup::getOrderIndex))
            .map(qsqg -> {
                QuestionGroup group = qsqg.getQuestionGroup();
                List<QuestionRequest> questionResponses = group.getQuestions().stream()
                    .sorted(Comparator.comparing(Question::getOrderIndex))
                    .map(q -> new QuestionRequest(
                        q.getPrompt(),
                        q.getType(),
                        q.getMaxPoints(),
                        q.getContent(),
                        q.getRubric()
                    ))
                    .toList();
                return new QuestionGroupRequest(
                    group.getPrompt() == null ? "" : group.getPrompt(),
                    group.isGroup(),
                    questionResponses
                );
            })
            .toList();

        return new QuestionSetDetailResponse(node.getId(), node.getName(), groupResponses);
    }

    public Page<NodeResponse> getContent(UUID userId, DomainType domainType, UUID parentId, Pageable pageable) {
        Sort sort = pageable.getSort();
        if (sort.isUnsorted()) {
            sort = Sort.by(
                Sort.Order.asc("nodeType"),
                Sort.Order.asc("orderIndex"),
                Sort.Order.asc("id")
            );
        } else {
            sort = Sort.by(Sort.Order.asc("nodeType")).and(sort);
        }

        Pageable sortedPageable = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            sort
        );

        return hierarchyNodeRepository.findPaginatedContent(userId, domainType, parentId, sortedPageable)
            .map(QuestionSetService::toResponse);
    }

    public HierarchyNode requireNode(UUID nodeId, DomainType domainType, UUID userId) {
        return hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(nodeId, userId, domainType)
            .orElseThrow(() -> new IllegalArgumentException("Node not found: " + nodeId));
    }

    public HierarchyNode createNode(UUID userId, DomainType domainType, String name, NodeType nodeType, UUID parentId) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Name cannot be empty");
        }

        User owner = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        HierarchyNode parent = parentId == null ? null : requireNode(parentId, domainType, userId);
        if (parent != null && parent.getNodeType() != NodeType.FOLDER) {
            throw new IllegalArgumentException("Parent must be a folder");
        }

        double orderIndex = SortOrderUtil.nextTail(
            hierarchyNodeRepository.findTypeSpecificSiblings(userId, domainType, parentId, nodeType).stream()
                .map(HierarchyNode::getOrderIndex)
                .toList()
        );

        HierarchyNode node = new HierarchyNode(name, nodeType, domainType, parent, orderIndex, owner);
        if (nodeType == NodeType.ITEM) {
            node.setContent(new QuestionSet());
            node.setContentType(ContentType.QUESTION_SET);
        }
        node.setPath("pending");
        node = hierarchyNodeRepository.save(node);
        node.setPath(pathFor(node.getId(), parent));

        if (parent != null) {
            parent.markModified();
            hierarchyNodeRepository.save(parent);
        }

        return hierarchyNodeRepository.save(node);
    }

    public NodeResponse renameNode(UUID userId, DomainType domainType, UUID nodeId, String newName) {
        if (!StringUtils.hasText(newName)) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        HierarchyNode node = requireNode(nodeId, domainType, userId);
        node.setName(newName);
        node.markModified();
        if (node.getParent() != null) {
            node.getParent().markModified();
            hierarchyNodeRepository.save(node.getParent());
        }
        return toResponse(hierarchyNodeRepository.save(node));
    }

    public NodeResponse moveNode(UUID userId, DomainType domainType, UUID nodeId, UUID previousSiblingId) {
        HierarchyNode node = requireNode(nodeId, domainType, userId);
        UUID parentId = node.getParent() == null ? null : node.getParent().getId();

        double orderIndex = allocateOrderIndex(userId, domainType, parentId, previousSiblingId, nodeId);
        node.setOrderIndex(orderIndex);
        node.markModified();

        if (node.getParent() != null) {
            node.getParent().markModified();
            hierarchyNodeRepository.save(node.getParent());
        }

        return toResponse(hierarchyNodeRepository.save(node));
    }

    @Transactional
    public void applySortToOrderIndex(UUID userId, DomainType domainType, UUID parentId, Sort sort) {
        if (sort == null || sort.isUnsorted()) {
            return;
        }

        // Maintain FOLDERs first, followed by requested sort, using id as a tie-breaker
        Sort finalSort = Sort.by(Sort.Order.asc("nodeType"))
            .and(sort)
            .and(Sort.by(Sort.Order.asc("id")));

        List<HierarchyNode> sortedNodes = hierarchyNodeRepository.findByOwnerUserIdAndDomainTypeAndParentId(userId, domainType, parentId, finalSort);

        double index = SortOrderUtil.DEFAULT_STRIDE;
        for (HierarchyNode node : sortedNodes) {
            node.setOrderIndex(index);
            node.markModified();
            index += SortOrderUtil.DEFAULT_STRIDE;
        }

        hierarchyNodeRepository.saveAll(sortedNodes);

        if (parentId != null) {
            hierarchyNodeRepository.findById(parentId).ifPresent(parent -> {
                parent.markModified();
                hierarchyNodeRepository.save(parent);
            });
        }
    }

    public void moveNodes(UUID userId, DomainType domainType, List<UUID> nodeIds, UUID destinationParentId) {
        Set<UUID> nodeIdSet = sanitizeNullableIds(nodeIds);
        if (nodeIdSet.isEmpty()) {
            throw new IllegalArgumentException("nodeIds cannot be empty");
        }

        HierarchyNode destinationParent = destinationParentId == null ? null : requireNode(destinationParentId, domainType, userId);
        if (destinationParent != null && destinationParent.getNodeType() != NodeType.FOLDER) {
            throw new DomainBoundaryViolationException("Destination parent must be a folder");
        }

        List<HierarchyNode> selectedNodes = hierarchyNodeRepository.findByIdInAndOwnerUserIdAndDomainType(nodeIdSet, userId, domainType);
        if (selectedNodes.size() != nodeIdSet.size()) {
            throw new IllegalArgumentException("One or more nodes were not found");
        }

        List<HierarchyNode> roots = collapseToDistinctRoots(selectedNodes);
        Map<UUID, List<HierarchyNode>> subtreesByRoot = loadSubtreesByRoot(userId, domainType, roots);
        Set<UUID> subtreeNodeIds = subtreesByRoot.values().stream().flatMap(List::stream).map(HierarchyNode::getId)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        if (subtreeNodeIds.size() > MAX_COPY_OR_DELETE_ITEMS) {
            throw new ContentTooLargeException("Move exceeds limit");
        }

        String destinationPath = destinationParent == null ? null : destinationParent.getPath();
        for (HierarchyNode root : roots) {
            if (destinationPath != null && (destinationPath.equals(root.getPath()) || destinationPath.startsWith(root.getPath() + "."))) {
                throw new DomainBoundaryViolationException("Cannot move a node into itself or one of its descendants");
            }
        }

        Set<UUID> movedRootIds = roots.stream().map(HierarchyNode::getId).collect(Collectors.toSet());
        Map<NodeType, Double> cursorByType = new LinkedHashMap<>();
        for (NodeType nodeType : NodeType.values()) {
            double cursor = SortOrderUtil.nextTail(
                hierarchyNodeRepository.findTypeSpecificSiblingsForUpdate(userId, domainType, destinationParentId, nodeType).stream()
                    .filter(node -> !movedRootIds.contains(node.getId()))
                    .map(HierarchyNode::getOrderIndex)
                    .toList()
            );
            cursorByType.put(nodeType, cursor);
        }

        Set<HierarchyNode> toSave = new LinkedHashSet<>();
        if (destinationParent != null) {
            destinationParent.markModified();
            toSave.add(destinationParent);
        }

        for (HierarchyNode root : roots) {
            if (root.getParent() != null) {
                root.getParent().markModified();
                toSave.add(root.getParent());
            }

            List<HierarchyNode> subtree = subtreesByRoot.get(root.getId());
            String oldRootPath = root.getPath();
            String newRootPath = destinationPath == null ? labelFor(root.getId()) : destinationPath + "." + labelFor(root.getId());

            root.setParent(destinationParent);
            root.setOrderIndex(cursorByType.get(root.getNodeType()));
            cursorByType.put(root.getNodeType(), cursorByType.get(root.getNodeType()) + SortOrderUtil.DEFAULT_STRIDE);
            root.setPath(newRootPath);
            root.markModified();
            toSave.add(root);

            for (HierarchyNode source : subtree) {
                if (source.getId().equals(root.getId())) {
                    continue;
                }
                source.setPath(newRootPath + source.getPath().substring(oldRootPath.length()));
                toSave.add(source);
            }
        }

        hierarchyNodeRepository.saveAll(toSave);
    }

    public void deleteNodes(UUID userId, DomainType domainType, List<UUID> nodeIds) {
        Set<UUID> nodeIdSet = sanitizeNullableIds(nodeIds);
        if (nodeIdSet.isEmpty()) return;

        List<HierarchyNode> selectedNodes = hierarchyNodeRepository.findByIdInAndOwnerUserIdAndDomainType(nodeIdSet, userId, domainType);
        if (selectedNodes.size() != nodeIdSet.size()) {
            throw new IllegalArgumentException("One or more nodes were not found");
        }

        List<HierarchyNode> roots = collapseToDistinctRoots(selectedNodes);
        Set<HierarchyNode> parentsToUpdate = new LinkedHashSet<>();
        for (HierarchyNode root : roots) {
            if (root.getParent() != null) {
                parentsToUpdate.add(root.getParent());
            }
        }

        Map<UUID, List<HierarchyNode>> subtreesByRoot = loadSubtreesByRoot(userId, domainType, roots);
        List<HierarchyNode> toDelete = subtreesByRoot.values().stream().flatMap(List::stream).distinct()
            .sorted(Comparator.comparingInt((HierarchyNode n) -> levelOf(n.getPath())).reversed())
            .toList();

        if (toDelete.size() > MAX_COPY_OR_DELETE_ITEMS) {
            throw new ContentTooLargeException("Delete exceeds limit");
        }
        hierarchyNodeRepository.deleteAllInBatch(toDelete);

        for (HierarchyNode p : parentsToUpdate) {
            p.markModified();
            hierarchyNodeRepository.save(p);
        }
    }

    public List<UUID> copyNodes(UUID userId, DomainType sourceDomainType, List<UUID> nodeIds, UUID destinationParentId, DomainType targetDomainType) {
        Set<UUID> nodeIdSet = sanitizeNullableIds(nodeIds);
        if (nodeIdSet.isEmpty()) return List.of();

        HierarchyNode destinationParent = destinationParentId == null ? null : requireNode(destinationParentId, targetDomainType, userId);
        if (destinationParent != null && destinationParent.getNodeType() != NodeType.FOLDER) {
            throw new DomainBoundaryViolationException("Destination parent must be a folder");
        }

        List<HierarchyNode> selectedNodes = hierarchyNodeRepository.findByIdInAndOwnerUserIdAndDomainType(nodeIdSet, userId, sourceDomainType);
        if (selectedNodes.size() != nodeIdSet.size()) {
            throw new IllegalArgumentException("One or more nodes were not found");
        }

        List<HierarchyNode> roots = collapseToDistinctRoots(selectedNodes);
        Map<UUID, List<HierarchyNode>> subtreesByRoot = loadSubtreesByRoot(userId, sourceDomainType, roots);
        int totalEntities = subtreesByRoot.values().stream().mapToInt(List::size).sum();
        if (totalEntities > MAX_COPY_OR_DELETE_ITEMS) {
            throw new ContentTooLargeException("Copy exceeds limit");
        }

        // Eager batch fetching of QuestionSets in the subtrees to avoid N+1 query overhead
        List<UUID> questionSetIds = subtreesByRoot.values().stream()
            .flatMap(List::stream)
            .filter(n -> n.getNodeType() == NodeType.ITEM && n.getContentType() == ContentType.QUESTION_SET && n.getContent() != null)
            .map(n -> n.getContent().getId())
            .toList();

        Map<UUID, QuestionSet> questionSetsById = new LinkedHashMap<>();
        if (!questionSetIds.isEmpty()) {
            List<QuestionSet> detailedSets = questionSetRepository.findDetailedByIdsAndOwnerUserId(questionSetIds, userId);
            for (QuestionSet qs : detailedSets) {
                questionSetsById.put(qs.getId(), qs);
            }
        }

        Map<UUID, HierarchyNode> copiedBySourceId = new LinkedHashMap<>();
        List<HierarchyNode> nodesToSave = new ArrayList<>();
        Map<NodeType, Double> cursorByType = new LinkedHashMap<>();
        for (NodeType nodeType : NodeType.values()) {
            double cursor = SortOrderUtil.nextTail(
                hierarchyNodeRepository.findTypeSpecificSiblingsForUpdate(userId, targetDomainType, destinationParentId, nodeType).stream()
                    .map(HierarchyNode::getOrderIndex)
                    .toList()
            );
            cursorByType.put(nodeType, cursor);
        }

        if (destinationParent != null) {
            destinationParent.markModified();
        }

        for (HierarchyNode root : roots) {
            List<HierarchyNode> subtree = subtreesByRoot.get(root.getId()).stream()
                .sorted(Comparator.comparingInt(n -> levelOf(n.getPath())))
                .toList();

            for (HierarchyNode source : subtree) {
                HierarchyNode copiedParent = source.getId().equals(root.getId())
                    ? destinationParent
                    : copiedBySourceId.get(source.getParent().getId());

                double orderIndex = source.getId().equals(root.getId()) ? cursorByType.get(source.getNodeType()) : source.getOrderIndex();
                if (source.getId().equals(root.getId())) {
                    cursorByType.put(source.getNodeType(), cursorByType.get(source.getNodeType()) + SortOrderUtil.DEFAULT_STRIDE);
                }

                HierarchyNode copied = new HierarchyNode(source.getName(), source.getNodeType(), targetDomainType, copiedParent, orderIndex, source.getOwnerUser());
                copied.setContentType(source.getContentType());
                QuestionSet set = (source.getContent() != null) ? questionSetsById.get(source.getContent().getId()) : null;
                if (source.getNodeType() == NodeType.ITEM && source.getContentType() == ContentType.QUESTION_SET) {
                    if (set == null) {
                        throw new IllegalStateException("Source content missing");
                    }
                    copied.setContent(set.copy());
                }

                copied.setPath("pending");
                entityManager.persist(copied);
                copied.setPath(pathFor(copied.getId(), copiedParent));

                copiedBySourceId.put(source.getId(), copied);
                nodesToSave.add(copied);
            }
        }

        return nodesToSave.stream()
            .map(HierarchyNode::getId)
            .toList();
    }

    public Exam generateRandomExamFromPool(
        UUID poolId,
        UUID classroomId,
        String examTitle,
        int questionGroupCount,
        Instant startTime,
        Instant endTime,
        Integer duration,
        Integer maxAttempts,
        UUID userId
    ) {
        HierarchyNode node = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(poolId, userId, DomainType.POOL)
            .orElseThrow(() -> new IllegalArgumentException("Pool not found: " + poolId));

        if (node.getNodeType() != NodeType.ITEM || node.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Not a pool item: " + poolId);
        }

        QuestionSet pool = questionSetRepository.findDetailedByIdAndOwnerUserId(node.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Pool content missing"));

        Classroom classroom = classroomRepository.findById(classroomId)
            .orElseThrow(() -> new IllegalArgumentException("Classroom not found: " + classroomId));
        classroomAuthorizationService.assertCanManageExams(userId, classroom);

        int availableGroupCount = pool.getQuestionSetQuestionGroups().size();
        List<QuestionSetQuestionGroup> selected;

        if (questionGroupCount <= 0) {
            selected = new ArrayList<>(pool.getQuestionSetQuestionGroups());
        } else {
            if (questionGroupCount > availableGroupCount) {
                throw new IllegalArgumentException("Requested count out of range: " + availableGroupCount);
            }
            List<QuestionSetQuestionGroup> shuffled = new ArrayList<>(pool.getQuestionSetQuestionGroups());
            Collections.shuffle(shuffled, ThreadLocalRandom.current());
            selected = shuffled.subList(0, questionGroupCount);
        }

        Exam exam = Exam.builder()
            .title(examTitle)
            .classroom(classroom)
            .startTime(startTime == null ? Instant.now() : startTime)
            .endTime(endTime)
            .duration(duration != null ? Duration.ofSeconds(duration) : null)
            .maxAttempts(maxAttempts)
            .build();

        int orderIndex = 1;
        for (QuestionSetQuestionGroup qsqg : selected) {
            ExamQuestionGroup eqg = ExamQuestionGroup.builder()
                .exam(exam)
                .questionGroup(qsqg.getQuestionGroup().deepCopy())
                .orderIndex(orderIndex++)
                .build();
            exam.getExamQuestionGroups().add(eqg);
        }

        double examOrderIndex = SortOrderUtil.nextTail(
            examRepository.findByClassroomIdOrderByOrderIndexAsc(classroom.getId()).stream()
                .map(Exam::getOrderIndex)
                .toList()
        );
        exam.setOrderIndex(examOrderIndex);

        return examRepository.save(exam);
    }

    public HierarchyNode saveExamAsQuestionSet(UUID examId, DomainType targetDomain, String name, UUID parentId, UUID userId) {
        Exam exam = examRepository.findDetailedById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));
        classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());

        HierarchyNode node = createNode(userId, targetDomain, name, NodeType.ITEM, parentId);
        QuestionSet targetSet = questionSetRepository.findDetailedByIdAndOwnerUserId(node.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Target content missing"));

        int orderIndex = 1;
        for (ExamQuestionGroup eqg : exam.getExamQuestionGroups()) {
            targetSet.getQuestionSetQuestionGroups().add(
                new QuestionSetQuestionGroup(targetSet, eqg.getQuestionGroup().deepCopy(), orderIndex++)
            );
        }

        node.markModified();
        if (node.getParent() != null) {
            node.getParent().markModified();
            hierarchyNodeRepository.save(node.getParent());
        }
        return hierarchyNodeRepository.save(node);
    }

    public HierarchyNode generateTemplateFromPool(UUID poolId, String templateName, UUID parentId, Integer randomCount, UUID userId) {
        HierarchyNode poolNode = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(poolId, userId, DomainType.POOL)
            .orElseThrow(() -> new IllegalArgumentException("Pool not found: " + poolId));

        if (poolNode.getNodeType() != NodeType.ITEM || poolNode.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Not a pool item: " + poolId);
        }

        QuestionSet pool = questionSetRepository.findDetailedByIdAndOwnerUserId(poolNode.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Pool content missing"));

        HierarchyNode templateNode = createNode(userId, DomainType.TEMPLATE, templateName, NodeType.ITEM, parentId);
        QuestionSet templateSet = questionSetRepository.findDetailedByIdAndOwnerUserId(templateNode.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Template content missing"));

        List<QuestionSetQuestionGroup> poolGroups = new ArrayList<>(pool.getQuestionSetQuestionGroups());
        List<QuestionSetQuestionGroup> selected;

        if (randomCount != null && randomCount > 0) {
            if (randomCount > poolGroups.size()) {
                throw new IllegalArgumentException("Requested random count exceeds available question groups in pool: " + poolGroups.size());
            }
            Collections.shuffle(poolGroups, ThreadLocalRandom.current());
            selected = poolGroups.subList(0, randomCount);
        } else {
            selected = poolGroups;
        }

        int orderIndex = 1;
        for (QuestionSetQuestionGroup qsqg : selected) {
            templateSet.getQuestionSetQuestionGroups().add(
                new QuestionSetQuestionGroup(templateSet, qsqg.getQuestionGroup().deepCopy(), orderIndex++)
            );
        }

        templateNode.markModified();
        if (templateNode.getParent() != null) {
            templateNode.getParent().markModified();
            hierarchyNodeRepository.save(templateNode.getParent());
        }
        return hierarchyNodeRepository.save(templateNode);
    }


    public void copyQuestionsBetweenSets(UUID sourceSetId, DomainType sourceDomain, UUID targetSetId, DomainType targetDomain, UUID userId) {
        HierarchyNode sourceNode = requireNode(sourceSetId, sourceDomain, userId);
        HierarchyNode targetNode = requireNode(targetSetId, targetDomain, userId);

        if (sourceNode.getNodeType() != NodeType.ITEM || sourceNode.getContentType() != ContentType.QUESTION_SET ||
            targetNode.getNodeType() != NodeType.ITEM || targetNode.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Nodes must be question set items");
        }

        QuestionSet sourceSet = questionSetRepository.findDetailedByIdAndOwnerUserId(sourceNode.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Source content missing"));

        QuestionSet targetSet = questionSetRepository.findDetailedByIdAndOwnerUserId(targetNode.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Target content missing"));

        int orderIndex = targetSet.getQuestionSetQuestionGroups().stream()
            .map(QuestionSetQuestionGroup::getOrderIndex)
            .max(Integer::compareTo)
            .orElse(0) + 1;

        for (QuestionSetQuestionGroup qsqg : sourceSet.getQuestionSetQuestionGroups()) {
            targetSet.getQuestionSetQuestionGroups().add(
                new QuestionSetQuestionGroup(targetSet, qsqg.getQuestionGroup().deepCopy(), orderIndex++)
            );
        }

        targetNode.markModified();
        if (targetNode.getParent() != null) {
            targetNode.getParent().markModified();
            hierarchyNodeRepository.save(targetNode.getParent());
        }
        hierarchyNodeRepository.save(targetNode);
    }

    public void copyQuestionsToPool(UUID sourceId, UUID poolId, UUID userId, boolean fromExam) {
        HierarchyNode poolNode = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(poolId, userId, DomainType.POOL)
            .orElseThrow(() -> new IllegalArgumentException("Pool not found: " + poolId));

        if (poolNode.getNodeType() != NodeType.ITEM || poolNode.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Not a pool item: " + poolId);
        }

        QuestionSet pool = questionSetRepository.findDetailedByIdAndOwnerUserId(poolNode.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Pool content missing"));

        int orderIndex = pool.getQuestionSetQuestionGroups().stream()
            .map(QuestionSetQuestionGroup::getOrderIndex)
            .max(Integer::compareTo)
            .orElse(0) + 1;

        if (fromExam) {
            Exam exam = examRepository.findDetailedById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + sourceId));
            classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());

            for (ExamQuestionGroup eqg : exam.getExamQuestionGroups()) {
                pool.getQuestionSetQuestionGroups().add(new QuestionSetQuestionGroup(pool, eqg.getQuestionGroup().deepCopy(), orderIndex++));
            }
        } else {
            HierarchyNode sourceNode = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(sourceId, userId, DomainType.TEMPLATE)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourceId));

            if (sourceNode.getNodeType() != NodeType.ITEM || sourceNode.getContentType() != ContentType.QUESTION_SET) {
                throw new IllegalArgumentException("Not a question set item: " + sourceId);
            }

            QuestionSet source = questionSetRepository.findDetailedByIdAndOwnerUserId(sourceNode.getContent().getId(), userId)
                .orElseThrow(() -> new IllegalStateException("Source content missing"));

            for (QuestionSetQuestionGroup qsqg : source.getQuestionSetQuestionGroups()) {
                pool.getQuestionSetQuestionGroups().add(new QuestionSetQuestionGroup(pool, qsqg.getQuestionGroup().deepCopy(), orderIndex++));
            }
        }

        poolNode.markModified();
        if (poolNode.getParent() != null) {
            poolNode.getParent().markModified();
            hierarchyNodeRepository.save(poolNode.getParent());
        }
        hierarchyNodeRepository.save(poolNode);
    }

    public Exam copyPoolQuestionsToExam(UUID poolId, UUID examId, UUID userId) {
        HierarchyNode poolNode = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(poolId, userId, DomainType.POOL)
            .orElseThrow(() -> new IllegalArgumentException("Pool not found: " + poolId));

        if (poolNode.getNodeType() != NodeType.ITEM || poolNode.getContentType() != ContentType.QUESTION_SET) {
            throw new IllegalArgumentException("Not a pool item: " + poolId);
        }

        QuestionSet pool = questionSetRepository.findDetailedByIdAndOwnerUserId(poolNode.getContent().getId(), userId)
            .orElseThrow(() -> new IllegalStateException("Pool content missing"));

        Exam exam = examRepository.findDetailedById(examId)
            .orElseThrow(() -> new IllegalArgumentException("Exam not found: " + examId));

        classroomAuthorizationService.assertCanManageExams(userId, exam.getClassroom());

        int orderIndex = exam.getExamQuestionGroups().stream()
            .map(ExamQuestionGroup::getOrderIndex)
            .max(Integer::compareTo)
            .orElse(0) + 1;

        for (QuestionSetQuestionGroup qsqg : pool.getQuestionSetQuestionGroups()) {
            exam.getExamQuestionGroups().add(ExamQuestionGroup.builder()
                .exam(exam)
                .questionGroup(qsqg.getQuestionGroup().deepCopy())
                .orderIndex(orderIndex++)
                .build());
        }

        return examRepository.save(exam);
    }

    // --- Helpers ---

    private double allocateOrderIndex(UUID userId, DomainType domainType, UUID parentId, UUID previousSiblingId, UUID currentId) {
        HierarchyNode previous = null;
        if (previousSiblingId != null) {
            if (previousSiblingId.equals(currentId)) throw new DomainBoundaryViolationException("Relative to self");
            previous = hierarchyNodeRepository.findByIdAndOwnerUserIdAndDomainType(previousSiblingId, userId, domainType)
                .orElseThrow(() -> new DomainBoundaryViolationException("Sibling not found"));

            UUID actualParentId = previous.getParent() == null ? null : previous.getParent().getId();
            if (!Objects.equals(actualParentId, parentId))
                throw new DomainBoundaryViolationException("Parent mismatch");
        }

        Optional<HierarchyNode> next = findNextNode(userId, domainType, parentId, previous);
        Double prevIndex = previous == null ? null : previous.getOrderIndex();
        Double nextIndex = next.map(HierarchyNode::getOrderIndex).orElse(null);

        Optional<Double> allocated = SortOrderUtil.tryAllocate(prevIndex, nextIndex);
        if (allocated.isPresent()) {
            return allocated.get();
        }

        reindexSiblings(userId, domainType, parentId);
        HierarchyNode refreshedPrev = previous == null ? null : hierarchyNodeRepository.findById(previous.getId()).orElse(null);
        Optional<HierarchyNode> refreshedNext = findNextNode(userId, domainType, parentId, refreshedPrev);
        Double refreshedNextIndex = refreshedNext.map(HierarchyNode::getOrderIndex).orElse(null);
        return refreshedPrev == null ? SortOrderUtil.beforeFirst(refreshedNextIndex) : SortOrderUtil.nextAfter(refreshedPrev.getOrderIndex(), refreshedNextIndex);
    }

    private Optional<HierarchyNode> findNextNode(UUID userId, DomainType domainType, UUID parentId, HierarchyNode previous) {
        if (previous == null)
            return hierarchyNodeRepository.findFirstByOwnerUserIdAndDomainTypeAndParentIdOrderByOrderIndexAsc(userId, domainType, parentId);
        return hierarchyNodeRepository.findFirstByOwnerUserIdAndDomainTypeAndParentIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(userId, domainType, parentId, previous.getOrderIndex());
    }

    private void reindexSiblings(UUID userId, DomainType domainType, UUID parentId) {
        List<HierarchyNode> siblings = hierarchyNodeRepository.findByOwnerUserIdAndDomainTypeAndParentIdOrderByOrderIndexAsc(userId, domainType, parentId);
        double cursor = SortOrderUtil.DEFAULT_STRIDE;
        for (HierarchyNode node : siblings) {
            node.setOrderIndex(cursor);
            cursor += SortOrderUtil.DEFAULT_STRIDE;
        }
        hierarchyNodeRepository.saveAll(siblings);
    }

    private Map<UUID, List<HierarchyNode>> loadSubtreesByRoot(UUID userId, DomainType domainType, List<HierarchyNode> roots) {
        Map<UUID, List<HierarchyNode>> subtrees = new LinkedHashMap<>();
        for (HierarchyNode root : roots) {
            if (root.getNodeType() == NodeType.ITEM) {
                subtrees.put(root.getId(), List.of(root));
            } else {
                subtrees.put(root.getId(), hierarchyNodeRepository.findSubtree(userId, domainType.name(), root.getPath()));
            }
        }
        return subtrees;
    }

    private static List<HierarchyNode> collapseToDistinctRoots(List<HierarchyNode> rawNodes) {
        if (rawNodes.isEmpty()) return List.of();
        List<HierarchyNode> sorted = new ArrayList<>(rawNodes);
        sorted.sort(Comparator.comparing(HierarchyNode::getPath));
        List<HierarchyNode> roots = new ArrayList<>();
        HierarchyNode currentRoot = sorted.getFirst();
        roots.add(currentRoot);
        for (int i = 1; i < sorted.size(); i++) {
            HierarchyNode next = sorted.get(i);
            if (!next.getPath().startsWith(currentRoot.getPath() + ".")) {
                currentRoot = next;
                roots.add(currentRoot);
            }
        }
        return roots;
    }

    private static Set<UUID> sanitizeNullableIds(List<UUID> ids) {
        if (ids == null) return new LinkedHashSet<>();
        Set<UUID> result = new LinkedHashSet<>();
        for (UUID id : ids) {
            if (id == null) throw new IllegalArgumentException("null id");
            result.add(id);
        }
        return result;
    }

    private static int levelOf(String path) {
        return (path == null || path.isEmpty()) ? 0 : path.split("\\.").length;
    }

    private static String labelFor(UUID id) {
        return "n" + id.toString().replace("-", "");
    }

    private static String pathFor(UUID id, HierarchyNode parent) {
        String label = labelFor(id);
        return parent == null ? label : parent.getPath() + "." + label;
    }

    private static NodeResponse toResponse(HierarchyNode node) {
        return new NodeResponse(
            node.getId(),
            node.getName(),
            node.getNodeType(),
            node.getParent() == null ? null : node.getParent().getId(),
            node.getPath(),
            node.getOrderIndex(),
            node.getCreatedAt(),
            node.getModifiedAt()
        );
    }

    public List<NodeResponse> getBreadcrumb(UUID userId, DomainType domainType, UUID nodeId) {
        if (nodeId == null) return List.of();
        HierarchyNode node = requireNode(nodeId, domainType, userId);
        String[] pathParts = node.getPath().split("\\.");
        List<UUID> ancestorIds = new ArrayList<>();
        for (String part : pathParts) {
            if (part.startsWith("n")) {
                try {
                    String uuidStr = part.substring(1).replaceAll("(\\w{8})(\\w{4})(\\w{4})(\\w{4})(\\w{12})", "$1-$2-$3-$4-$5");
                    ancestorIds.add(UUID.fromString(uuidStr));
                } catch (Exception ignored) {
                }
            }
        }
        return hierarchyNodeRepository.findByIdInAndOwnerUserIdAndDomainType(ancestorIds, userId, domainType).stream()
            .sorted(Comparator.comparingInt(n -> levelOf(n.getPath())))
            .map(QuestionSetService::toResponse)
            .toList();
    }

    public List<NodeResponse> getFolderTree(UUID userId, DomainType domainType) {
        return hierarchyNodeRepository.findByOwnerUserIdAndDomainTypeAndNodeTypeOrderByOrderIndexAsc(userId, domainType, NodeType.FOLDER).stream()
            .map(QuestionSetService::toResponse)
            .toList();
    }

    public List<NodeResponse> getFullTree(UUID userId, DomainType domainType) {
        return hierarchyNodeRepository.findByOwnerUserIdAndDomainTypeOrderByOrderIndexAsc(userId, domainType).stream()
            .map(QuestionSetService::toResponse)
            .toList();
    }
}
