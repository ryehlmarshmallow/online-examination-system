package com.github.ryehlmarshmallow.oes.features.classroom.group.controller;

import com.github.ryehlmarshmallow.oes.features.classroom.group.dto.ClassroomGroupResponse;
import com.github.ryehlmarshmallow.oes.features.classroom.group.dto.CreateClassroomGroupRequest;
import com.github.ryehlmarshmallow.oes.features.classroom.group.dto.RenameClassroomGroupRequest;
import com.github.ryehlmarshmallow.oes.features.classroom.group.dto.MoveClassroomGroupRequest;
import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.features.classroom.group.service.ClassroomGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/classrooms/groups")
@RequiredArgsConstructor
public class ClassroomGroupController {

    private final ClassroomGroupService classroomGroupService;

    @GetMapping
    public List<ClassroomGroupResponse> listGroups(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomGroupService.listGroups(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassroomGroupResponse createGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody CreateClassroomGroupRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomGroupService.createGroup(
            userId,
            request.name()
        );
    }

    @PutMapping("/{groupId}/rename")
    public ClassroomGroupResponse renameGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID groupId,
        @Valid @RequestBody RenameClassroomGroupRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomGroupService.renameGroup(userId, groupId, request.name());
    }

    @PutMapping("/{groupId}/move")
    public ClassroomGroupResponse moveGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID groupId,
        @Valid @RequestBody MoveClassroomGroupRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomGroupService.moveGroup(userId, groupId, request.previousSiblingId());
    }


    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID groupId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        classroomGroupService.deleteGroup(userId, groupId);
        return ResponseEntity.noContent().build();
    }

    private static UUID requireAuthenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null || userDetails.getUser().getId() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        return userDetails.getUser().getId();
    }
}

