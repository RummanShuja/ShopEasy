package com.shopeasy.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.exception.ApiError;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

@Component
public class SecurityErrorHandler {
    private final ObjectMapper mapper;

    public SecurityErrorHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public void unauthorized(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "Sign in as an administrator to continue.");
    }

    public void forbidden(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.FORBIDDEN, "Administrator access is required.");
    }

    private void write(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), ApiError.of(status, message, Map.of()));
    }
}
