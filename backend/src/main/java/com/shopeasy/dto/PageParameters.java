package com.shopeasy.dto;

import com.shopeasy.exception.ApiException;
import org.springframework.data.domain.PageRequest;

public record PageParameters(String page, String size) {
    private static final int MAX_SIZE = 100;

    public boolean supplied() {
        return page != null || size != null;
    }

    public PageRequest toPageRequest(int defaultSize) {
        int number = positiveInteger("page", page, 0, 0, Integer.MAX_VALUE);
        int limit = positiveInteger("size", size, defaultSize, 1, MAX_SIZE);
        if ((long) number * limit > Integer.MAX_VALUE) {
            throw ApiException.badField("page", "This page is beyond the supported range.");
        }
        return PageRequest.of(number, limit);
    }

    private int positiveInteger(String field, String value, int fallback, int minimum, int maximum) {
        if (value == null) {
            return fallback;
        }
        try {
            int number = Integer.parseInt(value);
            if (number >= minimum && number <= maximum && value.matches("[0-9]+")) {
                return number;
            }
        } catch (NumberFormatException ignored) {
            // Overflow and malformed values receive the same field error.
        }
        throw ApiException.badField(field, "Enter a whole number from " + minimum + " to " + maximum + ".");
    }
}
