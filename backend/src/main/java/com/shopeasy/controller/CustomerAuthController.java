package com.shopeasy.controller;

import com.shopeasy.dto.CustomerAuth;
import com.shopeasy.service.CustomerAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerAuthController {
    private final CustomerAuthService auth;
    public CustomerAuthController(CustomerAuthService auth) { this.auth = auth; }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public CustomerAuth.Session register(@Valid @RequestBody CustomerAuth.Register body) { return auth.register(body); }
    @PostMapping("/login")
    public CustomerAuth.Session login(@Valid @RequestBody CustomerAuth.Login body) { return auth.login(body); }
    @GetMapping("/session")
    public CustomerAuth.Profile session(@AuthenticationPrincipal Jwt jwt) { return auth.profile(jwt.getSubject()); }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal Jwt jwt) { auth.logout(jwt.getClaimAsString("sid")); }
}
