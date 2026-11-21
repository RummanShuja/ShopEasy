package com.shopeasy.exception;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> invalidParameter(MethodArgumentTypeMismatchException exception) {
        return respond(HttpStatus.BAD_REQUEST, "Check the request parameters.", Map.of(exception.getName(), "Enter a supported value."));
    }

    @ExceptionHandler(BindException.class)
    ResponseEntity<ApiError> invalidFields(BindException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getFieldErrors().forEach(error -> fields.putIfAbsent(error.getField(),
                error.isBindingFailure() ? "Enter a valid value." : error.getDefaultMessage()));
        return respond(HttpStatus.BAD_REQUEST, "Check the highlighted fields.", fields);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> invalidBody(HttpMessageNotReadableException exception) {
        if (exception.getCause() instanceof MismatchedInputException mismatch) {
            String field = mismatch.getPath().stream().map(JsonMappingException.Reference::getFieldName)
                    .filter(name -> name != null).findFirst().orElse(null);
            if (field != null) {
                return respond(HttpStatus.BAD_REQUEST, "Check the highlighted fields.",
                        Map.of(field, "Enter a valid value."));
            }
        }
        return respond(HttpStatus.BAD_REQUEST, "Send a valid JSON request body.");
    }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> apiError(ApiException exception) {
        return respond(exception.status(), exception.getMessage(), exception.fieldErrors());
    }

    @ExceptionHandler({ProductNotFoundException.class, NoResourceFoundException.class})
    ResponseEntity<ApiError> notFound(Exception exception) {
        return respond(HttpStatus.NOT_FOUND, exception instanceof ProductNotFoundException
                ? exception.getMessage() : "The requested resource was not found.");
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ApiError> staleWrite() {
        return respond(HttpStatus.CONFLICT, "The product changed. Refresh and try again.");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> oversizedImage() {
        return respond(HttpStatus.PAYLOAD_TOO_LARGE, "Choose an image up to 5 MB.",
                Map.of("imageUrl", "Choose an image up to 5 MB."));
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    ResponseEntity<ApiError> missingFile() {
        return respond(HttpStatus.BAD_REQUEST, "Select an image to upload.",
                Map.of("imageUrl", "Select an image to upload."));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> wrongMethod(HttpRequestMethodNotSupportedException exception) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).headers(exception.getHeaders())
                .body(ApiError.of(HttpStatus.METHOD_NOT_ALLOWED, "This method is not supported here.", Map.of()));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiError> wrongMediaType() {
        return respond(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "This request content type is not supported.");
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpectedError(Exception exception) {
        LOGGER.error("Unexpected request failure", exception);
        return respond(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again.");
    }

    private ResponseEntity<ApiError> respond(HttpStatus status, String message) {
        return respond(status, message, Map.of());
    }

    private ResponseEntity<ApiError> respond(HttpStatus status, String message, Map<String, String> fields) {
        return ResponseEntity.status(status).body(ApiError.of(status, message, fields));
    }
}
