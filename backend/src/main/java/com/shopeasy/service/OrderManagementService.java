package com.shopeasy.service;

import com.mongodb.client.MongoClient;
import com.mongodb.MongoException;
import org.springframework.dao.DataAccessException;
import com.shopeasy.dto.OrderResponse;
import com.shopeasy.dto.PageResponse;
import com.shopeasy.exception.ApiException;
import com.shopeasy.model.*;
import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.*;
import org.springframework.data.mongodb.core.query.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class OrderManagementService {
    private final MongoTemplate mongo;
    private final MongoClient client;
    public OrderManagementService(MongoTemplate mongo, MongoClient client) { this.mongo = mongo; this.client = client; }

    public PageResponse<OrderResponse> list(String customerId, String search, OrderStatus status, PageRequest page) {
        List<Criteria> filters = new ArrayList<>();
        if (customerId != null) filters.add(Criteria.where("customerId").is(customerId));
        if (status != null) filters.add(statusCriteria(status));
        if (search != null && !search.isBlank()) {
            if (search.length() > 100) throw ApiException.badField("search", "Use up to 100 characters.");
            Pattern term = Pattern.compile(Pattern.quote(search.strip()), Pattern.CASE_INSENSITIVE);
            filters.add(new Criteria().orOperator(Criteria.where("reference").regex(term),
                    Criteria.where("customerName").regex(term), Criteria.where("email").regex(term)));
        }
        Query query = filters.isEmpty() ? new Query() : Query.query(new Criteria().andOperator(filters));
        long total = mongo.count(query, PurchaseOrder.class);
        List<OrderResponse> items = mongo.find(query.with(page.withSort(Sort.Direction.DESC, "createdAt", "id")), PurchaseOrder.class)
                .stream().map(OrderResponse::from).toList();
        return new PageResponse<>(items, page.getPageNumber(), page.getPageSize(), total,
                (int) Math.ceil((double) total / page.getPageSize()), (long) page.getOffset() + items.size() < total);
    }

    public OrderResponse detail(String orderId, String customerId) {
        return OrderResponse.from(find(mongo, orderId, customerId));
    }

    public Map<String, Long> stats() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("total", mongo.count(new Query(), PurchaseOrder.class));
        for (OrderStatus status : OrderStatus.values())
            counts.put(status.name(), mongo.count(Query.query(statusCriteria(status)), PurchaseOrder.class));
        return counts;
    }

    public OrderResponse update(String orderId, OrderStatus target, long expectedVersion, String note) {
        try (var session = client.startSession()) {
            PurchaseOrder updated = session.withTransaction(() -> {
                try {
                MongoOperations operations = mongo.withSession(session);
                PurchaseOrder order = find(operations, orderId, null);
                OrderStatus current = order.status() == null ? OrderStatus.PENDING : order.status();
                long version = order.version() == null ? 0L : order.version();
                if (version != expectedVersion) throw conflict();
                if (!current.next().contains(target))
                    throw new ApiException(HttpStatus.CONFLICT, "Cannot change " + current + " to " + target + ".");
                Query exact = Query.query(Criteria.where("id").is(orderId).and("version").is(order.version()));
                PurchaseOrder.StatusEvent event = new PurchaseOrder.StatusEvent(target, Instant.now(),
                        note == null || note.isBlank() ? label(target) : note.strip());
                Update change = new Update().set("status", target).set("version", version + 1);
                // Legacy documents can have a null/missing history, so set the appended list atomically under the version check.
                List<PurchaseOrder.StatusEvent> history = new ArrayList<>(order.statusHistory() == null ? List.of() : order.statusHistory());
                history.add(event);
                change.set("statusHistory", history);
                PurchaseOrder result = operations.findAndModify(exact, change,
                        FindAndModifyOptions.options().returnNew(true), PurchaseOrder.class);
                if (result == null) throw conflict();
                if (target == OrderStatus.CANCELLED) {
                    for (PurchaseOrder.Item line : order.items())
                        operations.updateFirst(Query.query(Criteria.where("id").is(line.productId())),
                                new Update().inc("stock", line.quantity()), Product.class);
                }
                return result;
                } catch (DataAccessException failure) {
                    // Let the MongoDB driver retry a transaction's write conflict. On retry the
                    // expected version is checked again, so competing admin changes receive 409.
                    if (failure.getCause() instanceof MongoException mongoFailure) throw mongoFailure;
                    throw failure;
                }
            });
            return OrderResponse.from(updated);
        }
    }

    private PurchaseOrder find(MongoOperations operations, String orderId, String customerId) {
        Query query = Query.query(Criteria.where("id").is(orderId));
        if (customerId != null) query.addCriteria(Criteria.where("customerId").is(customerId));
        PurchaseOrder order = operations.findOne(query, PurchaseOrder.class);
        if (order == null) throw new ApiException(HttpStatus.NOT_FOUND, "Order not found.");
        return order;
    }

    private Criteria statusCriteria(OrderStatus status) {
        return status == OrderStatus.PENDING ? new Criteria().orOperator(
                Criteria.where("status").is(OrderStatus.PENDING), Criteria.where("status").is(null))
                : Criteria.where("status").is(status);
    }
    private ApiException conflict() {
        return new ApiException(HttpStatus.CONFLICT, "This order changed. Refresh its details before updating again.");
    }
    private String label(OrderStatus status) {
        return switch (status) {
            case CONFIRMED -> "Order confirmed";
            case PROCESSING -> "Preparing your order";
            case SHIPPED -> "Order dispatched";
            case OUT_FOR_DELIVERY -> "Order out for delivery";
            case DELIVERED -> "Order delivered";
            case CANCELLED -> "Order cancelled";
            default -> "Order placed";
        };
    }
}
