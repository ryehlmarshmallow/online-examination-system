package com.github.ryehlmarshmallow.oes.common.exception;

public class RateLimitException extends RuntimeException {
    public RateLimitException(String message) {
        super(message);
    }
}
