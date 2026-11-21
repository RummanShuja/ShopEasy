package com.shopeasy.model;

import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("customerCarts")
public record CustomerCart(@Id String id, List<Entry> items, List<String> appliedMerges, @Version Long version) {
    public record Entry(String productId, int quantity) {}
}
