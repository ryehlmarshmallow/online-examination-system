package com.github.ryehlmarshmallow.oes.features.storage.service;

import com.github.ryehlmarshmallow.oes.features.storage.config.StorageConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
class StorageServiceIntegrationTest {

    @Container
    static MinIOContainer minio = new MinIOContainer("minio/minio:RELEASE.2024-01-16T16-07-38Z");

    @Autowired
    private StorageService storageService;

    @Autowired
    private S3Client s3Client;

    @Autowired
    private StorageConfig storageConfig;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("app.storage.endpoint", minio::getS3URL);
        registry.add("app.storage.access-key", minio::getUserName);
        registry.add("app.storage.secret-key", minio::getPassword);
    }

    @Test
    void shouldStoreAndDeleteFile() throws Exception {
        String bucket = storageConfig.getBucket();
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.pdf",
            "application/pdf",
            "hello world".getBytes()
        );

        // 1. Store
        String fileId = storageService.store(bucket, file);
        assertNotNull(fileId);

        // Verify exists
        assertDoesNotThrow(() -> s3Client.headObject(HeadObjectRequest.builder()
            .bucket(bucket)
            .key(fileId)
            .build()));

        // 2. Delete
        storageService.delete(bucket, fileId);

        // Verify deleted
        assertThrows(NoSuchKeyException.class, () -> s3Client.headObject(HeadObjectRequest.builder()
            .bucket(bucket)
            .key(fileId)
            .build()));
    }
}