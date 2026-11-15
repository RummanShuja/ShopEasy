package com.shopeasy.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DeliveryAddress(
        @NotBlank @Size(max = 120) String line1,
        @Size(max = 120) String line2,
        @NotBlank @Size(max = 80) String city,
        @NotBlank @Size(max = 80) String state,
        @NotBlank @Size(max = 16) String postalCode,
        @NotBlank @Size(max = 80) String country
) {
    public DeliveryAddress {
        line1 = trim(line1);
        line2 = trim(line2);
        city = trim(city);
        state = trim(state);
        postalCode = trim(postalCode);
        country = trim(country);
    }

    private static String trim(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
