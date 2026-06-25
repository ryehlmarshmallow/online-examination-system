package com.github.ryehlmarshmallow.oes.features.storage.exception;

import com.github.ryehlmarshmallow.oes.common.dto.ErrorMessageResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@Slf4j
@ControllerAdvice
public class StorageExceptionAdvice {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorMessageResponse> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        log.warn("Max upload size exceeded: {}", ex.getMessage());
        ErrorMessageResponse response = new ErrorMessageResponse("File too large", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE).body(response);
    }

    @ExceptionHandler(StorageFileNotFoundException.class)
    public ResponseEntity<ErrorMessageResponse> handleFileNotFound(StorageFileNotFoundException ex) {
        log.info("Storage file not found: {}", ex.getMessage());
        ErrorMessageResponse response = new ErrorMessageResponse("File not found", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(StorageInvalidFileTypeException.class)
    public ResponseEntity<ErrorMessageResponse> handleInvalidFileType(StorageInvalidFileTypeException ex) {
        log.warn("Invalid file type: {}", ex.getMessage());
        ErrorMessageResponse response = new ErrorMessageResponse("Invalid file type", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
