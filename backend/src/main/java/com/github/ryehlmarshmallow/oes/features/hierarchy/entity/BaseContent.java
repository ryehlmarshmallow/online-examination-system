package com.github.ryehlmarshmallow.oes.features.hierarchy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "base_contents")
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "content_type")
@Getter
@Setter
@NoArgsConstructor
public abstract class BaseContent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
}
