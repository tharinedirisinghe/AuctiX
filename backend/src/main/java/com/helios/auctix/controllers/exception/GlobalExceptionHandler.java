package com.helios.auctix.controllers.exception;

import com.helios.auctix.exception.UploadedFileCountMaxLimitExceedException;
import com.helios.auctix.exception.UploadedFileSizeMaxLimitExceedException;
import com.helios.auctix.exception.InvalidUserException;
import com.helios.auctix.exception.PermissionDeniedException;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.dao.PermissionDeniedDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.support.MethodArgumentTypeMismatchException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import javax.naming.LimitExceededException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return buildErrorResponse("Invalid parameter type", HttpStatus.BAD_REQUEST);
    }


    // This should handle any generic exception that is thrown
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception e) {
        log.error("Error occurred: {}", e.getMessage());
        // e.printStackTrace();
        return buildErrorResponse("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // handle AuthenticationException
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException e) {
        log.error("Authentication error occurred: {}", e.getMessage());
        return buildErrorResponse("Authentication failed", HttpStatus.UNAUTHORIZED);
    }

    // handle UsernameNotFoundException
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUsernameNotFoundException(UsernameNotFoundException e) {
        log.error("User not found: {}", e.getMessage());
        return buildErrorResponse("User not found", HttpStatus.NOT_FOUND);
    }

    // handle IllegalArgumentException
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.error("Illegal argument: {}", e.getMessage());
        return buildErrorResponse("Illegal argument", HttpStatus.BAD_REQUEST);
    }

    // handle UploadedFileCountMaxLimitExceedException
    @ExceptionHandler(UploadedFileCountMaxLimitExceedException.class)
    public ResponseEntity<Map<String, Object>> handleUploadedFileCountMaxLimitExceedException(UploadedFileCountMaxLimitExceedException e) {
        log.error("Uploaded file count exceeds maximum limit: {}", e.getMessage());
        return buildErrorResponse("Uploaded file count exceeds maximum limit", HttpStatus.BAD_REQUEST);
    }

    // handle UploadedFileSizeMaxLimitExceedException
    @ExceptionHandler(UploadedFileSizeMaxLimitExceedException.class)
    public ResponseEntity<Map<String, Object>> handleUploadedFileSizeMaxLimitExceedException(UploadedFileSizeMaxLimitExceedException e) {
        log.error("Uploaded file size exceeds maximum limit: {}", e.getMessage());
        return buildErrorResponse("Uploaded file size exceeds maximum limit", HttpStatus.BAD_REQUEST);
    }

    // handle LimitExceededException
    @ExceptionHandler(LimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleLimitExceededException(LimitExceededException e) {
        log.error("Limit exceeded: {}", e.getMessage());
        return buildErrorResponse("Limit exceeded", HttpStatus.BAD_REQUEST);
    }

    // handle InvalidUserException
    @ExceptionHandler(InvalidUserException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidUserException(InvalidUserException e) {
        log.error("Invalid user: {}", e.getMessage());
        return buildErrorResponse("User is invalid. could be suspended account", HttpStatus.FORBIDDEN);
    }

    // handle PermissionDeniedException
    @ExceptionHandler(PermissionDeniedException.class)
    public ResponseEntity<Map<String, Object>> handlePermissionDeniedException(PermissionDeniedException e) {
        log.error("Permission denied: {}", e.getMessage());
        return buildErrorResponse("Permission denied", HttpStatus.FORBIDDEN);
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(String message, HttpStatus status) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return new ResponseEntity<>(body, status);
    }
}