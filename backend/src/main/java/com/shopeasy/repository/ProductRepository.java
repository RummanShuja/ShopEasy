package com.shopeasy.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.shopeasy.model.Product;

public interface ProductRepository extends MongoRepository<Product, String>, ProductQueryRepository {}
