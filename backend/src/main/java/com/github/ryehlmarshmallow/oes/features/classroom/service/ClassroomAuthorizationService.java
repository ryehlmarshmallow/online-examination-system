package com.github.ryehlmarshmallow.oes.features.classroom.service;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomMember;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassroomAuthorizationService {

    private final ClassroomMemberRepository classroomMemberRepository;

    public ClassroomMember requireActiveMember(UUID classroomId, UUID userId) {
        return classroomMemberRepository.findByClassroomIdAndUserIdAndIsActiveTrue(classroomId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not an active member of this classroom"));
    }

    public ClassroomMember requireManageStudents(UUID classroomId, UUID userId) {
        ClassroomMember member = requireActiveMember(classroomId, userId);
        if (member.getRole() == ClassroomRole.OWNER || member.isCanManageStudents()) {
            return member;
        }

        throw new IllegalArgumentException("You do not have permission to manage classroom students");
    }

    public ClassroomMember requireManageExams(UUID classroomId, UUID userId) {
        ClassroomMember member = requireActiveMember(classroomId, userId);
        if (member.getRole() == ClassroomRole.OWNER) {
            return member;
        }
        if (member.getRole() == ClassroomRole.STAFF && member.isCanManageExams()) {
            return member;
        }

        throw new IllegalArgumentException("You do not have permission to manage classroom exams");
    }

    public ClassroomMember requireManageGrades(UUID classroomId, UUID userId) {
        ClassroomMember member = requireActiveMember(classroomId, userId);
        if (member.getRole() == ClassroomRole.OWNER || member.isCanManageGrades()) {
            return member;
        }

        throw new IllegalArgumentException("You do not have permission to manage classroom grades");
    }

    public ClassroomMember requireOwner(UUID classroomId, UUID userId) {
        ClassroomMember member = requireActiveMember(classroomId, userId);
        if (member.getRole() == ClassroomRole.OWNER) {
            return member;
        }

        throw new IllegalArgumentException("Only the classroom owner can perform this action");
    }

    public void assertCanManageExams(UUID userId, Classroom classroom) {
        requireManageExams(classroom.getId(), userId);
    }
}

