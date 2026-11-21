package com.shopeasy.model;

import java.util.List;

public enum OrderStatus {
    PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED;

    public List<OrderStatus> next() {
        return switch (this) {
            case PENDING -> List.of(CONFIRMED, CANCELLED);
            case CONFIRMED -> List.of(PROCESSING, CANCELLED);
            case PROCESSING -> List.of(SHIPPED, CANCELLED);
            case SHIPPED -> List.of(OUT_FOR_DELIVERY);
            case OUT_FOR_DELIVERY -> List.of(DELIVERED);
            case DELIVERED, CANCELLED -> List.of();
        };
    }
}
