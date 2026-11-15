package com.shopeasy.service;

import com.shopeasy.dto.PageResponse;
import com.shopeasy.dto.ProductFilter;
import com.shopeasy.dto.ProductRequest;
import com.shopeasy.dto.ProductResponse;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface ProductService {
    ProductResponse create(ProductRequest request);
    List<ProductResponse> list(ProductFilter filter, boolean includeInactive);
    PageResponse<ProductResponse> listPage(ProductFilter filter, Pageable pageable);
    ProductResponse getActive(String id);
    ProductResponse update(String id, ProductRequest request);
    void delete(String id);
    List<String> categories();
}
