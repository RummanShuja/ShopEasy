package com.shopeasy.dto;

import com.shopeasy.model.PurchaseOrder;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        String reference, String customerName, String email, Instant createdAt, List<Item> items, BigDecimal total
) {
    public record Item(String productId, String productName, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}

    public static OrderResponse from(PurchaseOrder order) {
        List<Item> items = order.items().stream()
                .map(item -> new Item(item.productId(), item.productName(), item.quantity(), item.unitPrice(), item.lineTotal()))
                .toList();
        return new OrderResponse(order.reference(), order.customerName(), order.email(), order.createdAt(), items, order.total());
    }
}
