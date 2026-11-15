package com.shopeasy.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        String id, String name, String description, String category, String brand,
        BigDecimal price, int discountPercent, BigDecimal discountedPrice, int stock,
        String imageUrl, double rating, boolean active, LocalDateTime createdAt
) {}
