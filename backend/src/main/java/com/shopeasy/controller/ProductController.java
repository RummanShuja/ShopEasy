package com.shopeasy.controller;

import com.shopeasy.dto.PageParameters;
import com.shopeasy.dto.ProductFilter;
import com.shopeasy.dto.ProductRequest;
import com.shopeasy.dto.ProductResponse;
import com.shopeasy.service.ProductService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {
    private final ProductService products;

    public ProductController(ProductService products) {
        this.products = products;
    }

    @GetMapping("/api/products")
    public Object list(@Valid @ModelAttribute ProductFilter filter, @ModelAttribute PageParameters pagination) {
        if (pagination.supplied()) {
            return products.listPage(filter, pagination.toPageRequest(8));
        }
        return products.list(filter, false);
    }

    @GetMapping("/api/admin/products")
    public List<ProductResponse> inventory(@Valid @ModelAttribute ProductFilter filter) {
        return products.list(filter, true);
    }

    @GetMapping("/api/products/categories")
    public List<String> categories() {
        return products.categories();
    }

    @GetMapping("/api/products/{id}")
    public ProductResponse get(@PathVariable String id) {
        return products.getActive(id);
    }

    @PostMapping("/api/products")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
        ProductResponse product = products.create(request);
        return ResponseEntity.created(URI.create("/api/products/" + product.id())).body(product);
    }

    @PutMapping("/api/products/{id}")
    public ProductResponse update(@PathVariable String id, @Valid @RequestBody ProductRequest request) {
        return products.update(id, request);
    }

    @DeleteMapping("/api/products/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        products.delete(id);
        return ResponseEntity.noContent().build();
    }
}
