package com.shopeasy.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("orders")
public record PurchaseOrder(
        @Id String id,
        String reference,
        String customerName,
        String email,
        String phone,
        DeliveryAddress deliveryAddress,
        Instant createdAt,
        List<Item> items,
        @Field(targetType = FieldType.STRING) BigDecimal total
) {
    public record Item(
            String productId,
            String productName,
            int quantity,
            @Field(targetType = FieldType.STRING) BigDecimal unitPrice,
            @Field(targetType = FieldType.STRING) BigDecimal lineTotal
    ) {}
}
