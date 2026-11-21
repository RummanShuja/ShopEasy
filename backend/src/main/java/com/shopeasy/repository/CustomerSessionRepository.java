package com.shopeasy.repository;

import com.shopeasy.model.CustomerSession;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CustomerSessionRepository extends MongoRepository<CustomerSession, String> {}
