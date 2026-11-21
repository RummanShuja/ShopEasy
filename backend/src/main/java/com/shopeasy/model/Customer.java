package com.shopeasy.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("customers")
public record Customer(@Id String id, String name, String email, String passwordHash, Instant createdAt) {}
