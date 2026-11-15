package com.shopeasy.controller;

import com.shopeasy.dto.OrderRequest;
import com.shopeasy.dto.OrderResponse;
import com.shopeasy.dto.PageParameters;
import com.shopeasy.dto.PageResponse;
import com.shopeasy.service.OrderService;
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

    public OrderController(OrderService orders) {
        this.orders = orders;
    }

    @PostMapping("/api/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse place(@RequestHeader(name = "Idempotency-Key", required = false) String key,
                               @Valid @RequestBody OrderRequest request) {
        return orders.place(key, request);
    }

    @GetMapping("/api/admin/orders")
    public PageResponse<OrderResponse> history(@ModelAttribute PageParameters pagination) {
        return orders.history(pagination.toPageRequest(10));
    }
}
