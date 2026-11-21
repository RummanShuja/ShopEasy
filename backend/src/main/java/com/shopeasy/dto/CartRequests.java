package com.shopeasy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public final class CartRequests {
    private CartRequests() {}
    public record Quantity(@NotNull @Min(0) @Max(100000) Integer quantity) {}
    public record Entry(@NotBlank @Size(max = 128) String productId, @NotNull @Min(1) @Max(100000) Integer quantity) {}
    public record Merge(@NotBlank @Pattern(regexp = "[a-zA-Z0-9-]{16,64}") String mergeId,
                        @NotNull @Size(max = 100) List<@NotNull @Valid Entry> items) {}
}
