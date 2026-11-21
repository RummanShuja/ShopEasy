package com.shopeasy.dto;

import java.util.List;

public record CartResponse(List<Line> items, List<String> adjustments) {
    public record Line(ProductResponse product, int quantity) {}
}
