package com.shopeasy.config;

import com.shopeasy.model.Customer;
import com.shopeasy.model.CustomerSession;
import com.shopeasy.model.PurchaseOrder;
import java.time.Duration;
import java.util.Objects;
import org.bson.Document;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

@Component
public class CustomerIndexes implements ApplicationRunner {
    private final MongoTemplate mongo;
    public CustomerIndexes(MongoTemplate mongo) { this.mongo = mongo; }
    @Override
    public void run(ApplicationArguments arguments) {
        ensureIndex(Customer.class, new Index().on("email", Sort.Direction.ASC).unique());
        ensureIndex(CustomerSession.class, new Index().on("expiresAt", Sort.Direction.ASC).expire(Duration.ZERO));
        ensureIndex(PurchaseOrder.class, new Index().on("customerId", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC));
    }

    private void ensureIndex(Class<?> entityType, Index definition) {
        IndexOperations operations = mongo.indexOps(entityType);
        IndexInfo required = IndexInfo.indexInfoOf(new Document(definition.getIndexOptions())
                .append("key", definition.getIndexKeys()).append("name", "required"));
        // An equivalent MongoDB index can have a custom name (for example "email").
        // Keep its name and constraints rather than recreating it under a generated name.
        boolean exists = operations.getIndexInfo().stream().anyMatch(existing -> equivalent(existing, required));
        if (!exists) operations.ensureIndex(definition);
    }

    private boolean equivalent(IndexInfo existing, IndexInfo required) {
        return existing.getIndexFields().equals(required.getIndexFields())
                && existing.isUnique() == required.isUnique()
                && existing.isSparse() == required.isSparse()
                && existing.isHidden() == required.isHidden()
                && Objects.equals(existing.getPartialFilterExpression(), required.getPartialFilterExpression())
                && existing.getCollation().equals(required.getCollation())
                && existing.getExpireAfter().equals(required.getExpireAfter());
    }
}
