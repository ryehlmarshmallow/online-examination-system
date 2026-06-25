package com.github.ryehlmarshmallow.oes.features.classroom.repository;

import com.github.ryehlmarshmallow.oes.features.classroom.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClassroomRepository extends JpaRepository<Classroom, UUID> {
}

