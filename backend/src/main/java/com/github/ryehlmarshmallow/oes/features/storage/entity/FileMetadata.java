package com.github.ryehlmarshmallow.oes.features.storage.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "file_metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {

    @Id
    @Column(name = "file_id", nullable = false, updatable = false)
    private String fileId;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "upload_timestamp", nullable = false)
    @Builder.Default
    private Instant uploadTimestamp = Instant.now();
}
