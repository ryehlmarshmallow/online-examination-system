package com.github.ryehlmarshmallow.oes.common.dto;

public record ErrorResponse(
    String error,
    String code
) {
    public ErrorResponse(String error) {
        this(error, null);
    }
}

