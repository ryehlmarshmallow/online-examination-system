package com.github.ryehlmarshmallow.oes.features.exam.group.controller;

import com.github.ryehlmarshmallow.oes.features.exam.group.dto.CreateExamGroupRequest;
import com.github.ryehlmarshmallow.oes.features.exam.group.dto.ExamGroupResponse;
import com.github.ryehlmarshmallow.oes.features.exam.group.dto.RenameExamGroupRequest;
import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.features.exam.group.service.ExamGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/classrooms/{classroomId}/exam-groups")
@RequiredArgsConstructor
public class ExamGroupController {

    private final ExamGroupService examGroupService;

    @GetMapping
    public List<ExamGroupResponse> listGroups(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examGroupService.listGroups(userId, classroomId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExamGroupResponse createGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @Valid @RequestBody CreateExamGroupRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examGroupService.createGroup(
            userId,
            classroomId,
            request.name()
        );
    }

    @PutMapping("/{groupId}/rename")
    public ExamGroupResponse renameGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @PathVariable UUID groupId,
        @Valid @RequestBody RenameExamGroupRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return examGroupService.renameGroup(userId, classroomId, groupId, request.name());
    }


    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @PathVariable UUID groupId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        examGroupService.deleteGroup(userId, classroomId, groupId);
        return ResponseEntity.noContent().build();
    }

    private static UUID requireAuthenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null || userDetails.getUser().getId() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        return userDetails.getUser().getId();
    }
}

