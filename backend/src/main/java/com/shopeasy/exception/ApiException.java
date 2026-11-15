package com.shopeasy.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final Map<String, String> fieldErrors;

    public ApiException(HttpStatus status, String message) {
        this(status, message, Map.of());
    }

    public ApiException(HttpStatus status, String message, Map<String, String> fieldErrors) {
        super(message);
        this.status = status;
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public HttpStatus status() {
        return status;
    }

    public Map<String, String> fieldErrors() {
        return fieldErrors;
    }

    public static ApiException badField(String field, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "Check the highlighted fields.", Map.of(field, message));
    }
}
