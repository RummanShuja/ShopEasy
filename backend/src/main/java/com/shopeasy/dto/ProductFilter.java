package com.shopeasy.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductFilter(
        @Size(max = 100) String search,
        String category,
        @DecimalMin("0") BigDecimal minPrice,
        @DecimalMin("0") BigDecimal maxPrice,
        @Pattern(regexp = "price_asc|price_desc|rating|newest", message = "Use price_asc, price_desc, rating, or newest") String sort
) {}
