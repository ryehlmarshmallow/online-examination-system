package com.github.ryehlmarshmallow.oes.common.exception;

import com.github.ryehlmarshmallow.oes.common.dto.ErrorResponse;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptAccessDeniedException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptNotFoundException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.AttemptNotInProgressException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.InvalidFileSubmissionException;
import com.github.ryehlmarshmallow.oes.features.exam.attempt.exception.QuestionNotInAttemptException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String ACCOUNT_UNVERIFIED = "ACCOUNT_UNVERIFIED";
    private static final String ACCOUNT_LOCKED = "ACCOUNT_LOCKED";

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("Invalid argument: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(AttemptNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleAttemptNotFoundException(AttemptNotFoundException ex) {
        log.info("Attempt not found: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(QuestionNotInAttemptException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleQuestionNotInAttemptException(QuestionNotInAttemptException ex) {
        log.info("Question not in attempt: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(AttemptAccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleAttemptAccessDeniedException(AttemptAccessDeniedException ex) {
        log.warn("Access denied to attempt: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(AttemptNotInProgressException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleAttemptNotInProgressException(AttemptNotInProgressException ex) {
        log.info("Attempt not in progress: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(InvalidFileSubmissionException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidFileSubmissionException(InvalidFileSubmissionException ex) {
        log.warn("Invalid file submission: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleBadCredentialsException(BadCredentialsException ex) {
        log.info("Authentication failed: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleIllegalStateException(IllegalStateException ex) {
        log.warn("Illegal state: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(DisabledException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleDisabledException(DisabledException ex) {
        log.info("Account disabled: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage(), ACCOUNT_UNVERIFIED);
    }

    @ExceptionHandler(LockedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ErrorResponse handleLockedException(LockedException ex) {
        log.info("Account locked: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage(), ACCOUNT_LOCKED);
    }

    @ExceptionHandler(RateLimitException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public ErrorResponse handleRateLimitException(RateLimitException ex) {
        log.warn("Rate limit exceeded: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(ContentTooLargeException.class)
    @ResponseStatus(HttpStatus.CONTENT_TOO_LARGE)
    public ErrorResponse handleContentTooLargeException(ContentTooLargeException ex) {
        log.warn("Content too large: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(UnprocessableContentException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
    public ErrorResponse handleUnprocessableContentException(UnprocessableContentException ex) {
        log.warn("Unprocessable content: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(DomainBoundaryViolationException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_CONTENT)
    public ErrorResponse handleDomainBoundaryViolationException(DomainBoundaryViolationException ex) {
        log.warn("Domain boundary violation: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(fieldError -> {
                String field = fieldError.getField();
                String defaultMessage = fieldError.getDefaultMessage();
                return field + ": " + defaultMessage;
            })
            .orElse("Invalid request data");
        log.info("Validation failed: {}", message);
        return new ErrorResponse(message);
    }

    @ExceptionHandler({ConstraintViolationException.class, HandlerMethodValidationException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleConstraintViolationException(Exception ex) {
        log.info("Constraint violation: {}", ex.getMessage());
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        log.info("Malformed request body: {}", ex.getMessage());
        return new ErrorResponse("Malformed request body");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        String message = String.format("Parameter '%s' has invalid value '%s'", ex.getName(), ex.getValue());
        log.info("Type mismatch: {}", message);
        return new ErrorResponse(message);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return new ErrorResponse("An unexpected error occurred");
    }
}
