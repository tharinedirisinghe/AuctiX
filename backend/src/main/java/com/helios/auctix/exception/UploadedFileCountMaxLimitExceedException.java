package com.helios.auctix.exception;

public class UploadedFileCountMaxLimitExceedException extends RuntimeException {
    public UploadedFileCountMaxLimitExceedException(String message) {
        super(message);
    }
}
