package com.github.ryehlmarshmallow.oes.features.classroom.controller;

import com.github.ryehlmarshmallow.oes.common.security.CustomUserDetails;
import com.github.ryehlmarshmallow.oes.common.security.ratelimit.RateLimit;
import com.github.ryehlmarshmallow.oes.features.classroom.dto.*;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @GetMapping
    public List<MyClassroomResponse> listMyClassrooms(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.listMyClassrooms(userId);
    }

    @RateLimit(limit = 5, timeWindowSeconds = 60)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassroomResponse createClassroom(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody CreateClassroomRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.createClassroom(userId, request.name(), request.description());
    }

    @GetMapping("/{classroomId}/members")
    public List<ClassroomMemberResponse> listMembers(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.listMembers(userId, classroomId);
    }

    @GetMapping("/{classroomId}/invites")
    public List<ClassroomInviteResponse> listClassroomInvites(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.listClassroomInvites(userId, classroomId);
    }

    @RateLimit(limit = 30, timeWindowSeconds = 60)
    @GetMapping("/{classroomId}/users/search")
    public List<UserLookupResponse> searchUsers(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @RequestParam String query
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.searchUsers(userId, classroomId, query);
    }

    @RateLimit(limit = 20, timeWindowSeconds = 60)
    @PostMapping("/{classroomId}/invites")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassroomInviteResponse inviteUser(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @Valid @RequestBody InviteUserRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.inviteUser(userId, classroomId, request.identifier());
    }

    @GetMapping("/invites/pending")
    public List<ClassroomInviteResponse> listMyInvites(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.listMyInvites(userId);
    }

    @GetMapping("/invites/{inviteId}")
    public ClassroomInviteResponse getInvite(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID inviteId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.getInvite(userId, inviteId);
    }

    @RateLimit(limit = 30, timeWindowSeconds = 60)
    @PostMapping("/invites/{inviteId}/accept")
    public ClassroomInviteResponse acceptInvite(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID inviteId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.acceptInvite(userId, inviteId);
    }

    @PostMapping("/invites/{inviteId}/reject")
    public ClassroomInviteResponse rejectInvite(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID inviteId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.rejectInvite(userId, inviteId);
    }

    @PostMapping("/{classroomId}/invites/{inviteId}/revoke")
    public ClassroomInviteResponse revokeInvite(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @PathVariable UUID inviteId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.revokeInvite(userId, classroomId, inviteId);
    }

    @RateLimit(limit = 10, timeWindowSeconds = 60)
    @RateLimit(limit = 100, timeWindowSeconds = 86_400)
    @PostMapping("/{classroomId}/invite-links")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassroomInviteLinkResponse createInviteLink(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @RequestBody CreateInviteLinkRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.createInviteLink(userId, classroomId, request.expiresAt(), request.maxUses());
    }

    @GetMapping("/{classroomId}/invite-links")
    public List<ClassroomInviteLinkResponse> listInviteLinks(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.listInviteLinks(userId, classroomId);
    }

    @DeleteMapping("/{classroomId}/invite-links/{linkId}")
    public ClassroomInviteLinkResponse revokeInviteLink(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @PathVariable UUID linkId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.revokeInviteLink(userId, classroomId, linkId);
    }

    @DeleteMapping("/{classroomId}/invites/history")
    public void deleteClassroomInviteHistory(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        classroomService.deleteClassroomInviteHistory(userId, classroomId);
    }

    @DeleteMapping("/{classroomId}/invite-links/inactive")
    public void deleteInactiveInviteLinks(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        classroomService.deleteInactiveInviteLinks(userId, classroomId);
    }

    @GetMapping("/invite-links/{token}")
    public ClassroomInviteLinkDetailsResponse getInviteLinkDetails(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable String token
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.getInviteLinkDetails(userId, token);
    }

    @RateLimit(limit = 30, timeWindowSeconds = 60)
    @PostMapping("/invite-links/{token}/accept")
    public ClassroomResponse acceptInviteLink(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable String token
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.acceptInviteLink(userId, token);
    }

    @PutMapping("/{classroomId}/members/{memberId}/permissions")
    public ClassroomMemberResponse updateMemberPermissions(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @PathVariable UUID memberId,
        @Valid @RequestBody UpdateMemberPermissionsRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.updateMemberPermissions(
            userId,
            classroomId,
            memberId,
            request.canManageExams(),
            request.canManageStudents(),
            request.canManageGrades(),
            request.role()
        );
    }

    @PutMapping("/group-moves")
    public List<ClassroomResponse> moveClassroomsToGroup(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody BulkMoveClassroomGroupRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.moveClassroomsToGroup(userId, request.classroomIds(), request.groupId());
    }

    @PostMapping("/{classroomId}/members/{memberId}/kick")
    public ResponseEntity<Void> kickMember(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @PathVariable UUID memberId
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        classroomService.kickMember(userId, classroomId, memberId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{classroomId}/move")
    public MyClassroomResponse moveClassroom(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable UUID classroomId,
        @Valid @RequestBody MoveClassroomRequest request
    ) {
        UUID userId = requireAuthenticatedUserId(userDetails);
        return classroomService.moveClassroom(userId, classroomId, request.groupId(), request.previousSiblingId());
    }

    private static UUID requireAuthenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null || userDetails.getUser().getId() == null) {
            throw new IllegalArgumentException("Not authenticated");
        }

        return userDetails.getUser().getId();
    }
}
