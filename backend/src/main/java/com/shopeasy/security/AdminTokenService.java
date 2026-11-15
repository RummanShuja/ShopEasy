package com.shopeasy.security;

import com.shopeasy.config.SecurityConfig;
import com.shopeasy.dto.AdminLoginRequest;
import com.shopeasy.dto.AdminLoginResponse;
import com.shopeasy.exception.ApiException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

@Service
public class AdminTokenService {
    private static final Duration TOKEN_LIFETIME = Duration.ofMinutes(30);
    private final String username;
    private final String passwordHash;
    private final PasswordEncoder passwords;
    private final JwtEncoder tokens;

    public AdminTokenService(@Value("${app.security.admin-username}") String username,
                             @Value("${app.security.admin-password}") String password,
                             @Value("${app.security.admin-password-min-length}") int minimumLength,
                             PasswordEncoder passwords, JwtEncoder tokens) {
        Assert.hasText(username, "Set ADMIN_USERNAME.");
        Assert.isTrue(username.length() <= 100, "ADMIN_USERNAME must be at most 100 characters.");
        Assert.isTrue(minimumLength >= 6 && minimumLength <= 72,
                "ADMIN_PASSWORD_MIN_LENGTH must be from 6 to 72.");
        Assert.isTrue(password.codePointCount(0, password.length()) >= minimumLength
                        && password.getBytes(StandardCharsets.UTF_8).length <= 72,
                "ADMIN_PASSWORD must be at least " + minimumLength + " characters and at most 72 UTF-8 bytes.");
        this.username = username;
        this.passwordHash = passwords.encode(password);
        this.passwords = passwords;
        this.tokens = tokens;
    }

    public AdminLoginResponse login(AdminLoginRequest request) {
        byte[] suppliedPassword = request.password().getBytes(StandardCharsets.UTF_8);
        boolean validPassword = suppliedPassword.length <= 72 && passwords.matches(request.password(), passwordHash);
        boolean validUsername = MessageDigest.isEqual(username.getBytes(StandardCharsets.UTF_8),
                request.username().getBytes(StandardCharsets.UTF_8));
        if (!validPassword || !validUsername) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "The username or password is incorrect.");
        }

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(SecurityConfig.TOKEN_ISSUER)
                .subject(username)
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_LIFETIME))
                .claim("scope", "admin")
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = tokens.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AdminLoginResponse(token, TOKEN_LIFETIME.toSeconds());
    }
}
