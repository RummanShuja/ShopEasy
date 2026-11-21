package com.shopeasy.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("customerSessions")
public record CustomerSession(@Id String id, String customerId, Instant expiresAt) {}
