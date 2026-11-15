package com.shopeasy.repository;

import com.shopeasy.dto.ProductFilter;
import com.shopeasy.model.Product;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductQueryRepository {
    List<Product> findCatalogProducts(ProductFilter filter, boolean includeInactive);
    Page<Product> findCatalogProducts(ProductFilter filter, Pageable pageable);
    List<String> findActiveCategories();
}
