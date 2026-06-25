package com.github.ryehlmarshmallow.oes.features.questionset.controller;

import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.features.questionset.dto.*;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.DomainType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.NodeType;
import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.HierarchyNode;
import com.github.ryehlmarshmallow.oes.features.questionset.service.QuestionSetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final QuestionSetService questionSetService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionSetActionResponse createTemplate(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody CreateQuestionSetRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        HierarchyNode node = questionSetService.createNode(userId, DomainType.TEMPLATE, request.name(), NodeType.ITEM, request.parentId());
        return new QuestionSetActionResponse(node.getId());
    }

    @GetMapping("/{templateId}")
    public QuestionSetDetailResponse getTemplate(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID templateId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.getQuestionSetDetail(userId, DomainType.TEMPLATE, templateId);
    }

    @PutMapping("/{templateId}/questions")
    public ResponseEntity<Void> updateQuestions(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID templateId,
        @Valid @RequestBody SyncQuestionSetRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        questionSetService.updateQuestions(userId, DomainType.TEMPLATE, templateId, request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{templateId}/save-as")
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionSetActionResponse saveAs(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID templateId,
        @Valid @RequestBody SaveTemplateAsRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        var targetNode = questionSetService.createNode(userId, request.targetDomain(), request.name(), NodeType.ITEM, request.parentId());
        questionSetService.copyQuestionsBetweenSets(templateId, DomainType.TEMPLATE, targetNode.getId(), request.targetDomain(), userId);
        return new QuestionSetActionResponse(targetNode.getId());
    }


    @GetMapping("/tree")
    public List<NodeResponse> getFullTree(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.getFullTree(userId, DomainType.TEMPLATE);
    }

    @GetMapping("/folders/tree")
    public List<NodeResponse> getFolderTree(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.getFolderTree(userId, DomainType.TEMPLATE);
    }

    @GetMapping("/folders/{nodeId}/breadcrumb")
    public List<NodeResponse> getBreadcrumb(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID nodeId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.getBreadcrumb(userId, DomainType.TEMPLATE, nodeId);
    }

    @GetMapping("/folders/content")
    public Page<NodeResponse> getContent(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestParam(required = false) UUID parentId,
        Pageable pageable
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.getContent(userId, DomainType.TEMPLATE, parentId, pageable);
    }

    @PostMapping("/folders")
    @ResponseStatus(HttpStatus.CREATED)
    public NodeResponse createFolder(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody CreateQuestionSetRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        HierarchyNode node = questionSetService.createNode(userId, DomainType.TEMPLATE, request.name(), NodeType.FOLDER, request.parentId());
        return toResponse(node);
    }

    @PutMapping("/folders/{folderId}/rename")
    public NodeResponse renameFolder(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID folderId,
        @Valid @RequestBody RenameNodeRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.renameNode(userId, DomainType.TEMPLATE, folderId, request.name());
    }

    @PostMapping("/folders/{folderId}/move")
    public NodeResponse moveFolder(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID folderId,
        @RequestParam(required = false) UUID previousSiblingId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.moveNode(userId, DomainType.TEMPLATE, folderId, previousSiblingId);
    }

    @PostMapping("/folders/reindex")
    public ResponseEntity<Void> applySortToOrderIndex(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestParam(required = false) UUID parentId,
        Sort sort
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        questionSetService.applySortToOrderIndex(userId, DomainType.TEMPLATE, parentId, sort);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/folders/deletions")
    public ResponseEntity<Void> deleteNodes(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody BulkDeleteNodesRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        questionSetService.deleteNodes(userId, DomainType.TEMPLATE, request.nodeIds());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/folders/moves")
    public ResponseEntity<Void> moveNodes(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody BulkMoveNodesRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        questionSetService.moveNodes(userId, DomainType.TEMPLATE, request.nodeIds(), request.destinationParentId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/folders/copies")
    @ResponseStatus(HttpStatus.CREATED)
    public List<UUID> copyNodes(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @RequestBody BulkCopyNodesRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return questionSetService.copyNodes(userId, DomainType.TEMPLATE, request.nodeIds(), request.destinationParentId(), DomainType.TEMPLATE);
    }

    private static UUID requireAuthenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null || userDetails.getUser().getId() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return userDetails.getUser().getId();
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
}
