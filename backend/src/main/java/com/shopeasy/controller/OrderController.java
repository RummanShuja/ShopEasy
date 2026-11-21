package com.shopeasy.controller;

import com.shopeasy.dto.OrderRequest;
import com.shopeasy.dto.OrderResponse;
import com.shopeasy.dto.PageParameters;
import com.shopeasy.dto.PageResponse;
import com.shopeasy.service.OrderService;
import com.shopeasy.service.OrderManagementService;
import com.shopeasy.model.OrderStatus;
import jakarta.validation.constraints.*;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderController {
    private final OrderService orders;
    private final OrderManagementService management;

    public OrderController(OrderService orders, OrderManagementService management) {
        this.orders = orders;
        this.management = management;
    }

    @PostMapping("/api/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse place(@RequestHeader(name = "Idempotency-Key", required = false) String key,
                               @Valid @RequestBody OrderRequest request, @AuthenticationPrincipal Jwt jwt) {
        if (jwt != null && !"customer".equals(jwt.getClaimAsString("scope")))
            throw new com.shopeasy.exception.ApiException(HttpStatus.FORBIDDEN, "Use a customer account or guest checkout.");
        return orders.place(key, request, jwt == null ? null : jwt.getSubject());
    }

    @GetMapping("/api/admin/orders")
    public PageResponse<OrderResponse> history(@ModelAttribute PageParameters pagination,
            @RequestParam(required = false) String search, @RequestParam(required = false) OrderStatus status) {
        return management.list(null, search, status, pagination.toPageRequest(10));
    }

    @GetMapping("/api/admin/orders/stats")
    public Map<String, Long> stats() { return management.stats(); }

    @GetMapping("/api/admin/orders/{orderId}")
    public OrderResponse adminDetail(@PathVariable String orderId) { return management.detail(orderId, null); }

    public record StatusChange(@NotNull OrderStatus status, @NotNull @PositiveOrZero Long version, @Size(max = 300) String note) {}
    @PatchMapping("/api/admin/orders/{orderId}/status")
    public OrderResponse status(@PathVariable String orderId, @Valid @RequestBody StatusChange body) {
        return management.update(orderId, body.status(), body.version(), body.note());
    }

    @GetMapping("/api/orders")
    public PageResponse<OrderResponse> own(@AuthenticationPrincipal Jwt jwt, @ModelAttribute PageParameters pagination) {
        return management.list(jwt.getSubject(), null, null, pagination.toPageRequest(10));
    }

    @GetMapping("/api/orders/{orderId}")
    public OrderResponse ownDetail(@AuthenticationPrincipal Jwt jwt, @PathVariable String orderId) {
        return management.detail(orderId, jwt.getSubject());
    }
}
