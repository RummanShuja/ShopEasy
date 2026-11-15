package com.shopeasy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(
        @NotBlank @Size(max = 100) String customerName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotEmpty @Size(max = 100) List<@NotNull @Valid Item> items
) {
    public OrderRequest {
        customerName = strip(customerName);
        email = strip(email);
    }

    public record Item(
            @NotBlank @Size(max = 128) String productId,
            @NotNull @Positive Integer quantity,
            @NotNull @PositiveOrZero BigDecimal expectedUnitPrice
    ) {
        public Item {
            productId = strip(productId);
        }
    }

    private static String strip(String value) {
        return value == null ? null : value.strip();
    }
}
