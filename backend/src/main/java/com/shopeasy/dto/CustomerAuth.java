package com.shopeasy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Locale;
import com.shopeasy.model.Customer;

public final class CustomerAuth {
    private CustomerAuth() {}
    public record Register(@NotBlank @Size(max = 100) String name,
                           @NotBlank @Email @Size(max = 254) String email,
                           @NotBlank @Size(min = 8, max = 72) String password) {
        public Register { name = name == null ? null : name.strip(); email = normalize(email); }
    }
    public record Login(@NotBlank @Email @Size(max = 254) String email,
                        @NotBlank @Size(max = 72) String password) {
        public Login { email = normalize(email); }
    }
    public record Profile(String id, String name, String email) {
        public static Profile from(Customer customer) { return new Profile(customer.id(), customer.name(), customer.email()); }
    }
    public record Session(String accessToken, long expiresIn, Profile customer) {}
    private static String normalize(String email) { return email == null ? null : email.strip().toLowerCase(Locale.ROOT); }
}
