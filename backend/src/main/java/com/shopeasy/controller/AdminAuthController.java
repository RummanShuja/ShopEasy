package com.shopeasy.controller;

import com.shopeasy.dto.AdminLoginRequest;
import com.shopeasy.dto.AdminLoginResponse;
import com.shopeasy.security.AdminTokenService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminAuthController {
    private final AdminTokenService tokens;

    public AdminAuthController(AdminTokenService tokens) {
        this.tokens = tokens;
    }

    @PostMapping("/api/admin/login")
    public ResponseEntity<AdminLoginResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(tokens.login(request));
    }
}
