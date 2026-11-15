package com.shopeasy.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopeasy.dto.ImageUploadResponse;
import com.shopeasy.exception.ApiException;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestClientResponseException;

@Service
public class ImageUploadService {
    private static final Logger LOGGER = LoggerFactory.getLogger(ImageUploadService.class);
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private final RestClient cloudinary;
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public ImageUploadService(RestClient cloudinary,
            @Value("${app.cloudinary.name}") String cloudName,
            @Value("${app.cloudinary.key}") String apiKey,
            @Value("${app.cloudinary.secret}") String apiSecret) {
        this.cloudinary = cloudinary;
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    public ImageUploadResponse upload(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw ApiException.badField("imageUrl", "Select an image to upload.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Choose an image up to 5 MB.",
                    Map.of("imageUrl", "Choose an image up to 5 MB."));
        }

        byte[] bytes = file.getBytes();
        String format = imageFormat(bytes);
        if (format == null) {
            throw ApiException.badField("imageUrl", "Choose a JPG, PNG, or WebP image.");
        }
        if (!cloudName.matches("[A-Za-z0-9_-]+") || !StringUtils.hasText(apiKey) || !StringUtils.hasText(apiSecret)) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Image upload is unavailable.",
                    Map.of("imageUrl", "Cloudinary is not configured. Enter an existing image URL."));
        }

        String timestamp = Long.toString(Instant.now().getEpochSecond());
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentDispositionFormData("file", "product." + format);
        fileHeaders.setContentType(MediaType.parseMediaType("image/" + format));

        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new HttpEntity<>(new ByteArrayResource(bytes), fileHeaders));
        form.add("timestamp", timestamp);
        form.add("api_key", apiKey);
        form.add("signature", sign(timestamp));

        try {
            var response = cloudinary.post().uri("/v1_1/{cloud}/image/upload", cloudName)
                    .contentType(MediaType.MULTIPART_FORM_DATA).body(form)
                    .retrieve().toEntity(CloudinaryImage.class);
            CloudinaryImage image = response.getBody();
            if (image == null || !validCloudinaryUrl(image.secureUrl())) {
                LOGGER.warn("Cloudinary HTTP {}. Reason: missing or invalid HTTPS delivery URL.",
                        response.getStatusCode().value());
                throw unavailable();
            }
            return new ImageUploadResponse(image.secureUrl());
        } catch (RestClientResponseException response) {
            int status = response.getStatusCode().value();
            LOGGER.warn("Cloudinary HTTP {}. Reason: {}", status, sanitizedReason(response));
            if (status == 403) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Cloudinary refused the upload.",
                        Map.of("imageUrl", "Check the API key’s asset create permission or enter an image URL."));
            }
            throw unavailable();
        } catch (RestClientException exception) {
            LOGGER.warn("Cloudinary upload failed ({})", exception.getClass().getSimpleName());
            throw unavailable();
        }
    }

    private String sanitizedReason(RestClientResponseException response) {
        var headers = response.getResponseHeaders();
        String header = headers == null ? "" : headers.getFirst("X-Cld-Error");
        String reason = (header + " " + response.getResponseBodyAsString()).toLowerCase(Locale.ROOT);
        int status = response.getStatusCode().value();
        if (status == 403 && reason.contains("create") && (reason.contains("asset") || reason.contains("permission"))) {
            return "asset create permission required";
        }
        if (reason.contains("signature")) {
            return "signature rejected";
        }
        return switch (status) {
            case 400, 413, 415 -> "upload input rejected";
            case 401 -> "credentials rejected";
            case 403 -> "upload forbidden";
            case 429 -> "provider rate limit";
            default -> "provider request failed";
        };
    }

    private String sign(String timestamp) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha256.digest(("timestamp=" + timestamp + apiSecret)
                    .getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private boolean validCloudinaryUrl(String value) {
        if (value == null) {
            return false;
        }
        try {
            URI uri = URI.create(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && "res.cloudinary.com".equalsIgnoreCase(uri.getHost());
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private ApiException unavailable() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "Image upload failed. Try again or enter an image URL.",
                Map.of("imageUrl", "Cloudinary could not accept the image."));
    }

    private String imageFormat(byte[] bytes) {
        if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "jpeg";
        }
        if (bytes.length >= 8 && HexFormat.of().formatHex(bytes, 0, 8).equals("89504e470d0a1a0a")) {
            return "png";
        }
        if (bytes.length >= 12 && new String(bytes, 0, 4, StandardCharsets.US_ASCII).equals("RIFF")
                && new String(bytes, 8, 4, StandardCharsets.US_ASCII).equals("WEBP")) {
            return "webp";
        }
        return null;
    }

    private record CloudinaryImage(@JsonProperty("secure_url") String secureUrl) {
    }
}
