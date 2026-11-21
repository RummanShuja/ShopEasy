package com.shopeasy.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.shopeasy.model.DeliveryAddress;
import com.shopeasy.model.PurchaseOrder;
import com.shopeasy.model.OrderStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        String reference, String customerName, String email,
        @JsonInclude(JsonInclude.Include.NON_NULL) String phone,
        @JsonInclude(JsonInclude.Include.NON_NULL) DeliveryAddress deliveryAddress,
        Instant createdAt, List<Item> items, BigDecimal total,
        String id, OrderStatus status, List<PurchaseOrder.StatusEvent> statusHistory,
        long version, List<OrderStatus> allowedTransitions
) {
    public record Item(String productId, String productName, int quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}

    public static OrderResponse from(PurchaseOrder order) {
        List<Item> items = order.items().stream()
                .map(item -> new Item(item.productId(), item.productName(), item.quantity(), item.unitPrice(), item.lineTotal()))
                .toList();
        return new OrderResponse(order.reference(), order.customerName(), order.email(), order.phone(),
                order.deliveryAddress(), order.createdAt(), items, order.total(), order.id(),
                order.status() == null ? OrderStatus.PENDING : order.status(),
                order.statusHistory() == null ? List.of() : order.statusHistory(),
                order.version() == null ? 0 : order.version(),
                (order.status() == null ? OrderStatus.PENDING : order.status()).next());
    }
}
