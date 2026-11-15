package com.shopeasy.service;

import com.mongodb.ErrorCategory;
import com.mongodb.MongoException;
import com.mongodb.ReadConcern;
import com.mongodb.TransactionOptions;
import com.mongodb.WriteConcern;
import com.mongodb.client.MongoClient;
import com.shopeasy.dto.OrderRequest;
import com.shopeasy.dto.OrderResponse;
import com.shopeasy.dto.PageResponse;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.Product;
import com.shopeasy.model.PurchaseOrder;
import com.shopeasy.repository.OrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.bson.types.ObjectId;
import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class OrderService {
    private static final TransactionOptions CHECKOUT_OPTIONS = TransactionOptions.builder()
            .readConcern(ReadConcern.SNAPSHOT).writeConcern(WriteConcern.MAJORITY).build();
    private final MongoClient client;
    private final MongoTemplate mongo;
    private final OrderRepository orders;

    public OrderService(MongoClient client, MongoTemplate mongo, OrderRepository orders) {
        this.client = client;
        this.mongo = mongo;
        this.orders = orders;
    }

    public OrderResponse place(String idempotencyKey, OrderRequest request) {
        String key = checkoutKey(idempotencyKey);
        List<OrderRequest.Item> items = request.items().stream()
                .sorted(Comparator.comparing(OrderRequest.Item::productId)).toList();
        if (items.stream().map(OrderRequest.Item::productId).distinct().count() != items.size()) {
            throw ApiException.badField("items", "Combine quantities for repeated products.");
        }

        try (var session = client.startSession()) {
            PurchaseOrder order = session.withTransaction(() -> {
                try {
                    return saveOrder(mongo.withSession(session), key, request, items);
                } catch (DataAccessException failure) {
                    // The MongoDB driver reads error labels to retry transactions and commits safely.
                    if (failure.getCause() instanceof MongoException mongoFailure) {
                        throw mongoFailure;
                    }
                    throw failure;
                }
            }, CHECKOUT_OPTIONS);
            return OrderResponse.from(order);
        } catch (MongoException failure) {
            if (ErrorCategory.fromErrorCode(failure.getCode()) == ErrorCategory.DUPLICATE_KEY) {
                PurchaseOrder existing = orders.findById(key).orElse(null);
                if (existing != null) {
                    return OrderResponse.from(replay(existing, request, items));
                }
            }
            if (failure.getCode() == 20) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Checkout requires a MongoDB replica set or MongoDB Atlas.");
            }
            throw failure;
        }
    }

    public PageResponse<OrderResponse> history(PageRequest page) {
        return PageResponse.from(orders.findAll(page.withSort(Sort.Direction.DESC, "createdAt", "id"))
                .map(OrderResponse::from));
    }

    private PurchaseOrder saveOrder(MongoOperations operations, String key, OrderRequest request,
                                    List<OrderRequest.Item> items) {
        PurchaseOrder existing = operations.findById(key, PurchaseOrder.class);
        if (existing != null) {
            return replay(existing, request, items);
        }

        List<String> productIds = items.stream().map(OrderRequest.Item::productId).toList();
        Map<String, Product> products = operations.find(Query.query(Criteria.where("id").in(productIds)), Product.class)
                .stream().collect(Collectors.toMap(Product::id, Function.identity()));
        List<PurchaseOrder.Item> snapshots = new ArrayList<>(items.size());
        for (OrderRequest.Item item : items) {
            snapshots.add(snapshot(item, products.get(item.productId())));
        }

        for (OrderRequest.Item item : items) {
            Query available = Query.query(Criteria.where("id").is(item.productId()).and("active").is(true)
                    .and("stock").gte(item.quantity()));
            // MongoTemplate increments the product's @Version when an update omits that field.
            var result = operations.updateFirst(available, new Update().inc("stock", -item.quantity()), Product.class);
            if (result.getModifiedCount() == 0) {
                throw cartChanged("Stock changed. Review your cart and try again.");
            }
        }

        BigDecimal total = snapshots.stream().map(PurchaseOrder.Item::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        String reference = "SE-" + new ObjectId().toHexString().toUpperCase(Locale.ROOT);
        return operations.insert(new PurchaseOrder(key, reference, request.customerName(), request.email(),
                Instant.now().truncatedTo(ChronoUnit.MILLIS), snapshots, total));
    }

    private PurchaseOrder.Item snapshot(OrderRequest.Item item, Product product) {
        if (product == null || !product.active()) {
            throw cartChanged("An item is no longer available. Review your cart and try again.");
        }
        if (product.stock() < item.quantity()) {
            throw cartChanged("Only " + product.stock() + " available of " + product.name() + ". Review your cart.");
        }
        BigDecimal price = ProductPrices.discounted(product);
        if (price.compareTo(item.expectedUnitPrice()) != 0) {
            throw cartChanged("The price of " + product.name() + " changed. Review your cart.");
        }
        return new PurchaseOrder.Item(product.id(), product.name(), item.quantity(), price,
                price.multiply(BigDecimal.valueOf(item.quantity())));
    }

    private PurchaseOrder replay(PurchaseOrder existing, OrderRequest request, List<OrderRequest.Item> items) {
        if (!existing.customerName().equals(request.customerName()) || !existing.email().equals(request.email())
                || existing.items().size() != items.size()) {
            throw keyConflict();
        }
        for (int index = 0; index < items.size(); index++) {
            OrderRequest.Item expected = items.get(index);
            PurchaseOrder.Item saved = existing.items().get(index);
            if (!saved.productId().equals(expected.productId()) || saved.quantity() != expected.quantity()
                    || saved.unitPrice().compareTo(expected.expectedUnitPrice()) != 0) {
                throw keyConflict();
            }
        }
        return existing;
    }

    private String checkoutKey(String value) {
        if (value != null && value.matches("(?i)[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}")) {
            return UUID.fromString(value).toString();
        }
        throw ApiException.badField("idempotencyKey", "Supply a UUID in the Idempotency-Key header.");
    }

    private ApiException cartChanged(String message) {
        return new ApiException(HttpStatus.CONFLICT, message, Map.of("items", message));
    }

    private ApiException keyConflict() {
        String message = "This checkout key belongs to a different order.";
        return new ApiException(HttpStatus.CONFLICT, message, Map.of("idempotencyKey", message));
    }
}
