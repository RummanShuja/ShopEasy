package com.shopeasy.repository;

import com.shopeasy.model.CustomerCart;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CustomerCartRepository extends MongoRepository<CustomerCart, String> {}
