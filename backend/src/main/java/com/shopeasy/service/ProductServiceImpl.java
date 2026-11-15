package com.shopeasy.service;

import com.shopeasy.dto.PageResponse;
import com.shopeasy.dto.ProductFilter;
import com.shopeasy.dto.ProductRequest;
import com.shopeasy.dto.ProductResponse;
import com.shopeasy.exception.ApiException;
import com.shopeasy.exception.ProductNotFoundException;
import com.shopeasy.model.Product;
import com.shopeasy.repository.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class ProductServiceImpl implements ProductService {
    private final ProductRepository products;

    public ProductServiceImpl(ProductRepository products) {
        this.products = products;
    }

    @Override
    public ProductResponse create(ProductRequest request) {
        boolean active = !Boolean.FALSE.equals(request.active());
        Product product = fromRequest(request, null, null, LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MILLIS), active);
        return toResponse(products.insert(product));
    }

    @Override
    public List<ProductResponse> list(ProductFilter filter, boolean includeInactive) {
        validateRange(filter);
        return products.findCatalogProducts(filter, includeInactive).stream().map(this::toResponse).toList();
    }

    @Override
    public PageResponse<ProductResponse> listPage(ProductFilter filter, Pageable pageable) {
        validateRange(filter);
        return PageResponse.from(products.findCatalogProducts(filter, pageable).map(this::toResponse));
    }

    private void validateRange(ProductFilter filter) {
        validateBound("minPrice", filter.minPrice());
        validateBound("maxPrice", filter.maxPrice());
        if (filter.minPrice() != null && filter.maxPrice() != null
                && filter.minPrice().compareTo(filter.maxPrice()) > 0) {
            throw ApiException.badField("maxPrice", "Maximum price must be at least the minimum price.");
        }
    }

    @Override
    public ProductResponse getActive(String id) {
        Product product = find(id);
        if (!product.active()) {
            throw new ProductNotFoundException();
        }
        return toResponse(product);
    }

    @Override
    public ProductResponse update(String id, ProductRequest request) {
        Product existing = find(id);
        boolean active = request.active() == null ? existing.active() : request.active();
        Product updated = fromRequest(request, existing.id(), existing.version(), existing.createdAt(), active);
        return toResponse(products.save(updated));
    }

    @Override
    public void delete(String id) {
        products.delete(find(id));
    }

    @Override
    public List<String> categories() {
        return products.findActiveCategories();
    }

    private Product find(String id) {
        return products.findById(id).orElseThrow(ProductNotFoundException::new);
    }

    private Product fromRequest(ProductRequest request, String id, Long version, LocalDateTime createdAt, boolean active) {
        double price = request.price().doubleValue();
        if (!Double.isFinite(price) || price <= 0) {
            throw ApiException.badField("price", "Enter a positive price within the supported numeric range.");
        }
        return new Product(id, request.name(), request.description(), request.category(), request.brand(), price,
                request.discountPercent(), request.stock(), request.imageUrl(), request.rating().doubleValue(),
                active, createdAt, version);
    }

    private void validateBound(String name, BigDecimal value) {
        if (value != null && !Double.isFinite(value.doubleValue())) {
            throw ApiException.badField(name, "Enter a price within the supported numeric range.");
        }
    }

    private ProductResponse toResponse(Product product) {
        BigDecimal price = BigDecimal.valueOf(product.price());
        BigDecimal discounted = price.multiply(BigDecimal.valueOf(100L - product.discountPercent(), 2));
        return new ProductResponse(product.id(), product.name(), product.description(), product.category(),
                product.brand(), price.setScale(2, RoundingMode.HALF_UP), product.discountPercent(),
                discounted.setScale(2, RoundingMode.HALF_UP), product.stock(), product.imageUrl(),
                product.rating(), product.active(), product.createdAt());
    }
}
