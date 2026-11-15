package com.shopeasy.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.shopeasy.security.SecurityErrorHandler;
import jakarta.servlet.DispatcherType;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                        .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/*",
                                "/catalog/**", "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/catalog/**", "/actuator/health").permitAll()
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
        cors.setAllowedMethods(List.of("GET", "HEAD", "POST", "PUT", "DELETE", "OPTIONS"));
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
    SecretKey adminSigningKey(@Value("${app.security.jwt-secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        Assert.isTrue(bytes.length >= 32, "ADMIN_JWT_SECRET must be at least 32 bytes.");
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey key) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(TOKEN_ISSUER));
        return decoder;
    }
}
