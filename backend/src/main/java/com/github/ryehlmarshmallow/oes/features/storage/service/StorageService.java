package com.github.ryehlmarshmallow.oes.features.storage.service;

import com.github.ryehlmarshmallow.oes.features.storage.config.StorageConfig;
import com.github.ryehlmarshmallow.oes.features.storage.exception.StorageException;
import com.github.ryehlmarshmallow.oes.features.storage.exception.StorageInvalidFileTypeException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final S3Client s3Client;
    private final StorageConfig config;

    public String store(String bucket, MultipartFile file) {
        if (file.isEmpty()) {
            throw new StorageException("Cannot store empty file");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
            throw new StorageInvalidFileTypeException("File must have a valid name and extension");
        }

        String extension = StringUtils.getFilenameExtension(originalFilename);
        if (!StringUtils.hasText(extension) || !config.getAllowedExtensions().contains(extension.toLowerCase(Locale.ROOT))) {
            throw new StorageInvalidFileTypeException("File extension '" + extension + "' is not allowed");
        }

        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType) || !config.getAllowedContentTypes().contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new StorageInvalidFileTypeException("Content type '" + contentType + "' is not allowed");
        }

        String generatedFilename = UUID.randomUUID() + "." + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(generatedFilename)
                .contentType(contentType)
                .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return generatedFilename;
        } catch (IOException e) {
            throw new StorageException("Failed to store file", e);
        }
    }

    public void delete(String bucket, String filename) {
        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
            .bucket(bucket)
            .key(filename)
            .build();
        s3Client.deleteObject(deleteObjectRequest);
    }

    public InputStream load(String bucket, String filename) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(filename)
                .build();
            return s3Client.getObject(getObjectRequest);
        } catch (Exception e) {
            throw new StorageException("Failed to download file from S3", e);
        }
    }
}