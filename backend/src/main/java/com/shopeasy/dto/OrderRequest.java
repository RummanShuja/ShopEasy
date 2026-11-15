package com.shopeasy.dto;

import com.shopeasy.model.DeliveryAddress;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(
        @NotBlank @Size(max = 100) String customerName,
        @NotBlank @Email @Size(max = 254) String email,
        @Pattern(regexp = "\\+?[0-9(). -]{7,24}", message = "Enter a valid phone number.") String phone,
        @Valid DeliveryAddress deliveryAddress,
        @NotEmpty @Size(max = 100) List<@NotNull @Valid Item> items
) {
    public OrderRequest {
        customerName = strip(customerName);
        email = strip(email);
        phone = phone == null || phone.isBlank() ? null : phone.strip();
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
