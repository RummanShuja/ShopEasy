package com.shopeasy.controller;

import com.shopeasy.dto.ImageUploadResponse;
import com.shopeasy.service.ImageUploadService;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ImageUploadController {
    private final ImageUploadService images;

    public ImageUploadController(ImageUploadService images) {
        this.images = images;
    }

    @PostMapping(value = "/api/admin/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ImageUploadResponse upload(@RequestPart("file") MultipartFile file) throws IOException {
        return images.upload(file);
    }
}
