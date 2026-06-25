package com.github.ryehlmarshmallow.oes.features.exam.attempt.dto;

import java.io.Serializable;

public record FileDetails(
    String fileId,
    String originalFilename
) implements Serializable {
    private static final long serialVersionUID = 1L;
}
