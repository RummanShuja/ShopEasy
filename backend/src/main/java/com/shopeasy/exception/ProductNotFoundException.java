package com.shopeasy.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException() {
        super("Product was not found.");
    }
}
