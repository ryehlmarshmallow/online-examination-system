package com.github.ryehlmarshmallow.oes.features.storage.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

import java.net.URI;
import java.util.List;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.storage")
public class StorageConfig {

    private String endpoint = "http://localhost:9000";
    private String bucket = "oes-dev-student-submissions";
    private String accessKey = "minioadmin";
    private String secretKey = "miniopassword";
    private String region = "us-east-1";

    private DataSize maxFileSize = DataSize.ofMegabytes(10);
    private Integer maxFileCount = 5;

    private List<String> allowedContentTypes = List.of(
        "image/jpeg",
        "image/png",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip"
    );

    private List<String> allowedExtensions = List.of(
        "jpg",
        "jpeg",
        "png",
        "pdf",
        "doc",
        "docx",
        "zip"
    );

    @Bean
    public S3Client s3Client() {
        S3Client s3Client = S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)))
            .region(Region.of(region))
            .forcePathStyle(true)
            .build();

        try {
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
        } catch (BucketAlreadyExistsException | BucketAlreadyOwnedByYouException _) {
            // Bucket already exists
        }

        return s3Client;
    }
}
