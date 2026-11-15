package com.shopeasy.service;

import com.shopeasy.model.Product;
import java.math.BigDecimal;
import java.math.RoundingMode;

final class ProductPrices {
    private ProductPrices() {}

    static BigDecimal round(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    static BigDecimal original(Product product) {
        return round(BigDecimal.valueOf(product.price()));
    }

    static BigDecimal discounted(Product product) {
        BigDecimal factor = BigDecimal.valueOf(100L - product.discountPercent(), 2);
        return round(BigDecimal.valueOf(product.price()).multiply(factor));
    }
}
