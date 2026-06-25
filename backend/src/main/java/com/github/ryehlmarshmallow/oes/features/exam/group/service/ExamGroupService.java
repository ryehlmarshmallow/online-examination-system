package com.github.ryehlmarshmallow.oes.features.exam.group.service;

import com.github.ryehlmarshmallow.oes.features.exam.group.dto.ExamGroupResponse;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomAuthorizationService;
import com.github.ryehlmarshmallow.oes.features.exam.entity.Exam;
import com.github.ryehlmarshmallow.oes.features.exam.repository.ExamRepository;
import com.github.ryehlmarshmallow.oes.features.exam.group.entity.ExamGroup;
import com.github.ryehlmarshmallow.oes.features.exam.group.repository.ExamGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamGroupService {

    private final ExamGroupRepository examGroupRepository;
    private final ExamRepository examRepository;
    private final ClassroomRepository classroomRepository;
    private final ClassroomAuthorizationService classroomAuthorizationService;

    public ExamGroupResponse createGroup(UUID userId, UUID classroomId, String name) {
        classroomAuthorizationService.requireManageExams(classroomId, userId);
        validateName(name);
        Classroom classroom = classroomRepository.findById(classroomId)
            .orElseThrow(() -> new IllegalArgumentException("Classroom not found: " + classroomId));

        ExamGroup group = ExamGroup.builder()
            .name(name.trim())
            .classroom(classroom)
            .build();

        return toResponse(examGroupRepository.save(group));
    }

    public ExamGroupResponse renameGroup(UUID userId, UUID classroomId, UUID groupId, String name) {
        classroomAuthorizationService.requireManageExams(classroomId, userId);
        validateName(name);

        ExamGroup group = requireGroupInClassroom(groupId, classroomId);
        group.setName(name.trim());
        return toResponse(examGroupRepository.save(group));
    }

    public void deleteGroup(UUID userId, UUID classroomId, UUID groupId) {
        classroomAuthorizationService.requireManageExams(classroomId, userId);
        ExamGroup group = requireGroupInClassroom(groupId, classroomId);

        List<Exam> examsInGroup = examRepository.findByGroupId(groupId);
        if (!examsInGroup.isEmpty()) {
            examsInGroup.forEach(exam -> exam.setGroup(null));
            examRepository.saveAll(examsInGroup);
        }
        examGroupRepository.delete(group);
    }

    public List<ExamGroupResponse> listGroups(UUID userId, UUID classroomId) {
        classroomAuthorizationService.requireActiveMember(classroomId, userId);
        return examGroupRepository.findByClassroomIdOrderByCreatedAtAsc(classroomId).stream()
            .map(ExamGroupService::toResponse)
            .toList();
    }

    private ExamGroup requireGroupInClassroom(UUID groupId, UUID classroomId) {
        return examGroupRepository.findByIdAndClassroomId(groupId, classroomId)
            .orElseThrow(() -> new IllegalArgumentException("Exam group not found: " + groupId));
    }

    private static void validateName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new IllegalArgumentException("Group name cannot be empty");
        }
    }


    private static ExamGroupResponse toResponse(ExamGroup group) {
        return new ExamGroupResponse(
            group.getId(),
            group.getName(),
            group.getCreatedAt()
        );
    }
}


