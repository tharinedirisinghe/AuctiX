package com.helios.auctix.exception;

public class UploadedFileSizeMaxLimitExceedException extends RuntimeException {
    public UploadedFileSizeMaxLimitExceedException(String message) {
        super(message);
    }
}
