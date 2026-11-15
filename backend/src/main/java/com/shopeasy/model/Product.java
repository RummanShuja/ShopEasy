package com.shopeasy.model;

import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("products")
public record Product(
        @Id String id,
        String name,
        String description,
        String category,
        String brand,
        double price,
        int discountPercent,
        int stock,
        String imageUrl,
        double rating,
        boolean active,
        LocalDateTime createdAt,
        @Version Long version
) {}
