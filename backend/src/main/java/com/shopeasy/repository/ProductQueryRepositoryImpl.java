package com.shopeasy.repository;

import com.shopeasy.dto.ProductFilter;
import com.shopeasy.model.Product;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.util.StringUtils;

public class ProductQueryRepositoryImpl implements ProductQueryRepository {
    private static final int CASE_INSENSITIVE = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;
    private final MongoTemplate mongo;

    public ProductQueryRepositoryImpl(MongoTemplate mongo) {
        this.mongo = mongo;
    }

    @Override
    public List<Product> findCatalogProducts(ProductFilter filter, boolean includeInactive) {
        return mongo.find(catalogQuery(filter, includeInactive).with(sorting(filter.sort())), Product.class);
    }

    @Override
    public Page<Product> findCatalogProducts(ProductFilter filter, Pageable pageable) {
        Query filterQuery = catalogQuery(filter, false);
        Query pageQuery = Query.of(filterQuery).with(sorting(filter.sort())).with(pageable);
        return PageableExecutionUtils.getPage(mongo.find(pageQuery, Product.class), pageable,
                () -> mongo.count(filterQuery, Product.class));
    }

    private Query catalogQuery(ProductFilter filter, boolean includeInactive) {
        Query query = includeInactive ? new Query() : Query.query(Criteria.where("active").is(true));

        if (StringUtils.hasText(filter.search())) {
            String search = Pattern.quote(filter.search().strip());
            query.addCriteria(Criteria.where("name").regex(Pattern.compile(search, CASE_INSENSITIVE)));
        }
        if (StringUtils.hasText(filter.category())) {
            String category = "^" + Pattern.quote(filter.category().strip()) + "$";
            query.addCriteria(Criteria.where("category").regex(Pattern.compile(category, CASE_INSENSITIVE)));
        }
        if (filter.minPrice() != null || filter.maxPrice() != null) {
            Criteria price = Criteria.where("price");
            if (filter.minPrice() != null) {
                price.gte(filter.minPrice().doubleValue());
            }
            if (filter.maxPrice() != null) {
                price.lte(filter.maxPrice().doubleValue());
            }
            query.addCriteria(price);
        }
        return query;
    }

    @Override
    public List<String> findActiveCategories() {
        Query active = Query.query(Criteria.where("active").is(true));
        return mongo.findDistinct(active, "category", Product.class, String.class).stream()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    private Sort sorting(String sort) {
        Sort order = switch (sort == null ? "newest" : sort) {
            case "price_asc" -> Sort.by(Sort.Order.asc("price"));
            case "price_desc" -> Sort.by(Sort.Order.desc("price"));
            case "rating" -> Sort.by(Sort.Order.desc("rating"));
            default -> Sort.by(Sort.Order.desc("createdAt"));
        };
        return order.and(Sort.by(Sort.Order.desc("id")));
    }
}
