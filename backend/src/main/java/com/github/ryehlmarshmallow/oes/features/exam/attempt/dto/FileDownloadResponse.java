package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import java.io.InputStream;

public record FileDownloadResponse(
    InputStream inputStream,
    String filename,
    String contentType
) {
}
