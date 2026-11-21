package com.shopeasy.service;

import com.shopeasy.dto.*;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.CustomerCart;
import com.shopeasy.model.Product;
import com.shopeasy.repository.CustomerCartRepository;
import com.shopeasy.repository.ProductRepository;
import java.util.*;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class CustomerCartService {
    private final CustomerCartRepository carts;
    private final ProductRepository products;
    public CustomerCartService(CustomerCartRepository carts, ProductRepository products) {
        this.carts = carts; this.products = products;
    }
    private CustomerCart read(String customerId) {
        return carts.findById(customerId).orElse(new CustomerCart(customerId, List.of(), List.of(), null));
    }
    public CartResponse get(String customerId) {
        for (int attempt = 0; attempt < 5; attempt++) {
            CustomerCart cart = read(customerId);
            CartResponse normalized = response(cart, new ArrayList<>());
            List<CustomerCart.Entry> entries = normalized.items().stream()
                    .map(line -> new CustomerCart.Entry(line.product().id(), line.quantity())).toList();
            if (entries.equals(cart.items())) return normalized;
            try {
                carts.save(new CustomerCart(customerId, entries, cart.appliedMerges(), cart.version()));
                return normalized;
            } catch (OptimisticLockingFailureException | DuplicateKeyException error) {
                // Reconcile current stock without overwriting a simultaneous customer update.
            }
        }
        throw new ApiException(HttpStatus.CONFLICT, "Your cart changed on another device. Refresh and try again.");
    }

    public CartResponse quantity(String customerId, String productId, int quantity) {
        if (productId.length() > 128) throw ApiException.badField("productId", "Invalid product ID.");
        CustomerCart cart = read(customerId);
        Product product = products.findById(productId).orElse(null);
        if (quantity > 0 && (product == null || !product.active() || product.stock() < quantity)) {
            throw new ApiException(HttpStatus.CONFLICT, "This quantity is no longer available. Refresh your cart.");
        }
        List<CustomerCart.Entry> entries = new ArrayList<>(cart.items().stream()
                .filter(line -> !line.productId().equals(productId)).toList());
        if (quantity > 0) entries.add(new CustomerCart.Entry(productId, quantity));
        if (entries.size() > 100) throw ApiException.badField("items", "A cart can contain up to 100 different products.");
        try {
            return response(carts.save(new CustomerCart(customerId, entries, cart.appliedMerges(), cart.version())), new ArrayList<>());
        } catch (OptimisticLockingFailureException | DuplicateKeyException error) {
            throw new ApiException(HttpStatus.CONFLICT, "Your cart changed on another device. Refresh and try again.");
        }
    }

    public CartResponse merge(String customerId, CartRequests.Merge request) {
        if (request.items().stream().map(CartRequests.Entry::productId).distinct().count() != request.items().size())
            throw ApiException.badField("items", "Combine duplicate products before merging.");
        for (int attempt = 0; attempt < 5; attempt++) {
            CustomerCart cart = read(customerId);
            if (cart.appliedMerges().contains(request.mergeId())) return response(cart, new ArrayList<>());
            Map<String, Integer> quantities = new LinkedHashMap<>();
            cart.items().forEach(line -> quantities.put(line.productId(), line.quantity()));
            request.items().forEach(line -> quantities.merge(line.productId(), line.quantity(), Integer::sum));
            if (quantities.size() > 100) throw ApiException.badField("items", "Your combined cart exceeds 100 different products.");
            List<CustomerCart.Entry> entries = quantities.entrySet().stream()
                    .map(line -> new CustomerCart.Entry(line.getKey(), line.getValue())).toList();
            List<String> adjustments = new ArrayList<>();
            CartResponse normalized = response(new CustomerCart(customerId, entries, List.of(), null), adjustments);
            List<String> applied = new ArrayList<>(cart.appliedMerges());
            applied.add(request.mergeId());
            try {
                CustomerCart saved = carts.save(new CustomerCart(customerId, normalized.items().stream()
                        .map(line -> new CustomerCart.Entry(line.product().id(), line.quantity())).toList(), applied, cart.version()));
                return response(saved, adjustments);
            } catch (OptimisticLockingFailureException | DuplicateKeyException error) {
                // Re-read the persisted merge ID before retrying; a lost response cannot duplicate guest quantities.
            }
        }
        throw new ApiException(HttpStatus.CONFLICT, "Your cart is busy on another device. Retry the merge.");
    }

    private CartResponse response(CustomerCart cart, List<String> adjustments) {
        List<CartResponse.Line> result = new ArrayList<>();
        Map<String, Product> available = new HashMap<>();
        products.findAllById(cart.items().stream().map(CustomerCart.Entry::productId).toList())
                .forEach(product -> available.put(product.id(), product));
        for (CustomerCart.Entry line : cart.items()) {
            Product product = available.get(line.productId());
            if (product == null || !product.active() || product.stock() < 1) {
                adjustments.add((product == null ? "An unavailable product" : product.name()) + " was removed from your cart.");
                continue;
            }
            int count = Math.min(product.stock(), line.quantity());
            if (count < line.quantity()) adjustments.add(product.name() + " was adjusted to " + count + " available.");
            result.add(new CartResponse.Line(new ProductResponse(product.id(), product.name(), product.description(),
                    product.category(), product.brand(), ProductPrices.original(product), product.discountPercent(),
                    ProductPrices.discounted(product), product.stock(), product.imageUrl(), product.rating(),
                    product.active(), product.createdAt()), count));
        }
        return new CartResponse(result, List.copyOf(adjustments));
    }
}
