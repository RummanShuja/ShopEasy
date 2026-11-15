package com.shopeasy.repository;

import com.shopeasy.model.PurchaseOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OrderRepository extends MongoRepository<PurchaseOrder, String> {}
