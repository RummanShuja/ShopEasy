package com.shopeasy.seed;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopeasy.dto.ProductRequest;
import com.shopeasy.model.Product;
import com.shopeasy.repository.ProductRepository;
import jakarta.validation.Validator;
import java.io.InputStream;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.catalog.seed", havingValue = "true", matchIfMissing = true)
public class ProductDataSeeder implements CommandLineRunner {
    private static final Logger LOGGER = LoggerFactory.getLogger(ProductDataSeeder.class);
    private final ProductRepository products;
    private final ObjectMapper mapper;
    private final Validator validator;
    private final String publicApiUrl;
    private final boolean requirePublicHttps;

    public ProductDataSeeder(ProductRepository products, ObjectMapper mapper, Validator validator,
                             @Value("${app.catalog.public-api-url}") String publicApiUrl,
                             @Value("${app.catalog.require-public-https:false}") boolean requirePublicHttps) {
        this.products = products;
        this.mapper = mapper;
        this.validator = validator;
        this.publicApiUrl = publicApiUrl.replaceAll("/+$", "");
        this.requirePublicHttps = requirePublicHttps;
    }

    @Override
    public void run(String... args) throws Exception {
        if (products.count() != 0) {
            return;
        }
        if (requirePublicHttps && !isPublicHttpsOrigin()) {
            throw new IllegalStateException("Set PUBLIC_API_URL to the deployed HTTPS API origin before seeding.");
        }
        try (InputStream file = new ClassPathResource("seed/products.json").getInputStream()) {
            List<ProductRequest> fixtures = mapper.readValue(file, new TypeReference<>() {});
            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MILLIS);
            List<Product> catalog = new ArrayList<>();
            for (ProductRequest fixture : fixtures) {
                ProductRequest request = new ProductRequest(fixture.name(), fixture.description(), fixture.category(),
                        fixture.brand(), fixture.price(), fixture.discountPercent(), fixture.stock(),
                        publicApiUrl + "/catalog/" + fixture.imageUrl(), fixture.rating(), true);
                if (!validator.validate(request).isEmpty()) {
                    throw new IllegalStateException("Invalid seed product: " + request.name());
                }
                catalog.add(new Product(null, request.name(), request.description(), request.category(), request.brand(),
                        request.price().doubleValue(), request.discountPercent(), request.stock(), request.imageUrl(),
                        request.rating().doubleValue(), true, now.minusSeconds(catalog.size()), null));
            }
            products.insert(catalog);
            LOGGER.info("Seeded {} catalog products", catalog.size());
        }
    }

    private boolean isPublicHttpsOrigin() {
        try {
            URI origin = URI.create(publicApiUrl);
            return "https".equalsIgnoreCase(origin.getScheme()) && origin.getHost() != null
                    && !origin.getHost().toLowerCase(java.util.Locale.ROOT)
                            .matches("(?:.+\\.)?localhost\\.?|127\\..*|0\\.0\\.0\\.0|\\[::1\\]")
                    && origin.getPath().isEmpty() && origin.getQuery() == null && origin.getFragment() == null
                    && origin.getUserInfo() == null;
        } catch (IllegalArgumentException failure) {
            return false;
        }
    }
}
