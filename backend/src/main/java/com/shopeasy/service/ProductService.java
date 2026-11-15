package com.shopeasy.service;

import com.shopeasy.dto.ProductFilter;
import com.shopeasy.dto.ProductRequest;
import com.shopeasy.dto.ProductResponse;
import java.util.List;

public interface ProductService {
    ProductResponse create(ProductRequest request);
    List<ProductResponse> list(ProductFilter filter, boolean includeInactive);
    ProductResponse getActive(String id);
    ProductResponse update(String id, ProductRequest request);
    void delete(String id);
    List<String> categories();
}
