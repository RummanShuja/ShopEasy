package com.shopeasy.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.shopeasy.security.SecurityErrorHandler;
import com.shopeasy.repository.CustomerSessionRepository;
import com.shopeasy.service.CustomerAuthService;
import com.nimbusds.jwt.JWTParser;
import java.time.Instant;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import jakarta.servlet.DispatcherType;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.Assert;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
    public static final String TOKEN_ISSUER = "shopeasy-admin";

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, UrlBasedCorsConfigurationSource corsSource,
                                           SecurityErrorHandler errors) throws Exception {
        // The API accepts bearer headers and does not authenticate via cookies.
        return http
                .cors(cors -> cors.configurationSource(corsSource))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sessions -> sessions.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(access -> access
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/login", "/api/orders").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/customer/register", "/api/customer/login").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/*",
                                "/catalog/**", "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/catalog/**", "/actuator/health").permitAll()
                        .requestMatchers("/api/customer/**", "/api/cart/**", "/api/cart", "/api/orders", "/api/orders/**")
                                .hasAuthority("SCOPE_customer")
                        .requestMatchers("/api/admin/**", "/api/products", "/api/products/**")
                                .hasAuthority("SCOPE_admin")
                        .anyRequest().denyAll())
                .exceptionHandling(handler -> handler
                        .authenticationEntryPoint((request, response, error) -> errors.unauthorized(response))
                        .accessDeniedHandler((request, response, error) -> errors.forbidden(response)))
                .oauth2ResourceServer(server -> server
                        .jwt(jwt -> {})
                        .authenticationEntryPoint((request, response, error) -> errors.unauthorized(response)))
                .build();
    }

    @Bean
    UrlBasedCorsConfigurationSource corsSource(@Value("${app.security.allowed-origins}") String configuredOrigins) {
        List<String> origins = Arrays.stream(configuredOrigins.split(",")).map(String::strip)
                .filter(origin -> !origin.isEmpty()).toList();
        Assert.isTrue(!origins.isEmpty() && origins.stream().noneMatch(origin -> origin.contains("*")),
                "CORS_ALLOWED_ORIGINS must contain explicit frontend origins.");
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(origins);
        cors.setAllowedMethods(List.of("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
        cors.setExposedHeaders(List.of("Location"));
        cors.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cors);
        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecretKey adminSigningKey(@Value("${app.security.jwt-secret}") String secret, Environment environment)
            throws GeneralSecurityException {
        Assert.hasText(secret, "Set ADMIN_JWT_SECRET.");
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length >= 32) {
            return new SecretKeySpec(bytes, "HmacSHA256");
        }

        Assert.isTrue(environment.matchesProfiles("dev & !prod"),
                "ADMIN_JWT_SECRET must be at least 32 bytes.");
        byte[] salt = "ShopEasy development JWT".getBytes(StandardCharsets.UTF_8);
        PBEKeySpec spec = new PBEKeySpec(secret.toCharArray(), salt, 600_000, 256);
        try {
            byte[] derived = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
            return new SecretKeySpec(derived, "HmacSHA256");
        } finally {
            spec.clearPassword();
        }
    }

    @Bean
    @Primary
    JwtEncoder jwtEncoder(@Qualifier("adminSigningKey") SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder(@Qualifier("adminSigningKey") SecretKey key,
                          @Qualifier("customerSigningKey") SecretKey customerKey,
                          CustomerSessionRepository sessions) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(TOKEN_ISSUER));
        NimbusJwtDecoder customer = NimbusJwtDecoder.withSecretKey(customerKey).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> activeSession = jwt -> {
            String sid = jwt.getClaimAsString("sid");
            var saved = sid == null ? null : sessions.findById(sid).orElse(null);
            boolean valid = "customer".equals(jwt.getClaimAsString("scope")) && saved != null
                    && saved.customerId().equals(jwt.getSubject()) && saved.expiresAt().isAfter(Instant.now())
                    && jwt.getExpiresAt() != null && jwt.getExpiresAt().isAfter(Instant.now());
            return valid ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Customer session expired or revoked.", null));
        };
        customer.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(CustomerAuthService.ISSUER),
                new JwtTimestampValidator(Duration.ZERO), activeSession));
        return token -> {
            try {
                String issuer = JWTParser.parse(token).getJWTClaimsSet().getIssuer();
                return CustomerAuthService.ISSUER.equals(issuer) ? customer.decode(token) : decoder.decode(token);
            } catch (java.text.ParseException error) {
                throw new JwtException("Invalid access token.", error);
            }
        };
    }

    @Bean
    SecretKey customerSigningKey(@Value("${app.security.customer-jwt-secret}") String secret) {
        Assert.isTrue(secret.getBytes(StandardCharsets.UTF_8).length >= 32,
                "Set CUSTOMER_JWT_SECRET to at least 32 UTF-8 bytes.");
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean("customerJwtEncoder")
    JwtEncoder customerJwtEncoder(@Qualifier("customerSigningKey") SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }
}
