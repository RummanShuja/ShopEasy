package com.shopeasy.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import org.hibernate.validator.constraints.URL;

public record ProductRequest(
        @NotBlank @Size(min = 2, max = 100) String name,
        @NotBlank @Size(max = 500) String description,
        @NotBlank String category,
        @NotBlank String brand,
        @NotNull @DecimalMin(value = "0", inclusive = false) BigDecimal price,
        @NotNull @Min(0) @Max(90) Integer discountPercent,
        @NotNull @Min(0) Integer stock,
        @NotBlank @URL @Pattern(regexp = "(?i)^https?://[^\\s]+$", message = "Enter an HTTP or HTTPS URL") String imageUrl,
        @NotNull @DecimalMin("0") @DecimalMax("5") BigDecimal rating,
        Boolean active
) {
    public ProductRequest {
        name = strip(name);
        description = strip(description);
        category = strip(category);
        brand = strip(brand);
        imageUrl = strip(imageUrl);
    }

    private static String strip(String value) {
        return value == null ? null : value.strip();
    }
}
