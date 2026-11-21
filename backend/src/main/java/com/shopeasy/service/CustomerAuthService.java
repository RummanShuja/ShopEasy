package com.shopeasy.service;

import com.shopeasy.dto.CustomerAuth;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.Customer;
import com.shopeasy.model.CustomerSession;
import com.shopeasy.repository.CustomerRepository;
import com.shopeasy.repository.CustomerSessionRepository;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

@Service
public class CustomerAuthService {
    public static final String ISSUER = "shopeasy-customer";
    private final CustomerRepository customers;
    private final CustomerSessionRepository sessions;
    private final PasswordEncoder passwords;
    private final JwtEncoder encoder;
    private final String dummyHash;

    public CustomerAuthService(CustomerRepository customers, CustomerSessionRepository sessions,
            PasswordEncoder passwords, @Qualifier("customerJwtEncoder") JwtEncoder encoder) {
        this.customers = customers; this.sessions = sessions; this.passwords = passwords; this.encoder = encoder;
        this.dummyHash = passwords.encode(UUID.randomUUID().toString());
    }

    public CustomerAuth.Session register(CustomerAuth.Register request) {
        checkPassword(request.password());
        try {
            return issue(customers.insert(new Customer(null, request.name(), request.email(),
                    passwords.encode(request.password()), Instant.now())));
        } catch (DuplicateKeyException error) {
            throw ApiException.badField("email", "An account with this email already exists. Sign in instead.");
        }
    }

    public CustomerAuth.Session login(CustomerAuth.Login request) {
        checkPassword(request.password());
        Customer customer = customers.findByEmail(request.email()).orElse(null);
        boolean matches = passwords.matches(request.password(), customer == null ? dummyHash : customer.passwordHash());
        if (customer == null || !matches) throw new ApiException(HttpStatus.UNAUTHORIZED, "The email or password is incorrect.");
        return issue(customer);
    }

    public CustomerAuth.Profile profile(String id) {
        return CustomerAuth.Profile.from(customers.findById(id).orElseThrow(() ->
                new ApiException(HttpStatus.UNAUTHORIZED, "Sign in again to continue.")));
    }

    public void logout(String sessionId) { sessions.deleteById(sessionId); }

    private CustomerAuth.Session issue(Customer customer) {
        Instant now = Instant.now();
        String sid = UUID.randomUUID().toString();
        Instant expiry = now.plusSeconds(900);
        sessions.insert(new CustomerSession(sid, customer.id(), expiry));
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer(ISSUER).subject(customer.id())
                .issuedAt(now).expiresAt(expiry).claim("scope", "customer").claim("sid", sid).build();
        String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new CustomerAuth.Session(token, 900, CustomerAuth.Profile.from(customer));
    }

    private void checkPassword(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw ApiException.badField("password", "Use a password of at most 72 UTF-8 bytes.");
    }
}
