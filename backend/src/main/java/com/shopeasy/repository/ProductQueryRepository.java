package com.shopeasy.repository;

import com.shopeasy.dto.ProductFilter;
import com.shopeasy.model.Product;
import java.util.List;

public interface ProductQueryRepository {
    List<Product> findCatalogProducts(ProductFilter filter, boolean includeInactive);
    List<String> findActiveCategories();
}
