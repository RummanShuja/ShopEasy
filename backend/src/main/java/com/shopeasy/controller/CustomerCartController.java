package com.shopeasy.controller;

import com.shopeasy.dto.*;
import com.shopeasy.service.CustomerCartService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CustomerCartController {
    private final CustomerCartService carts;
    public CustomerCartController(CustomerCartService carts) { this.carts = carts; }
    @GetMapping public CartResponse get(@AuthenticationPrincipal Jwt jwt) { return carts.get(jwt.getSubject()); }
    @PutMapping("/items/{productId}")
    public CartResponse quantity(@AuthenticationPrincipal Jwt jwt, @PathVariable String productId,
                                 @Valid @RequestBody CartRequests.Quantity body) {
        return carts.quantity(jwt.getSubject(), productId, body.quantity());
    }
    @PostMapping("/merge")
    public CartResponse merge(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CartRequests.Merge body) {
        return carts.merge(jwt.getSubject(), body);
    }
}
