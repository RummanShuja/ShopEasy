const PRODUCT_FILTERS = ['search', 'category', 'minPrice', 'maxPrice', 'sort', 'minRating', 'inStock', 'offersOnly'];

export function productQuery(params) {
  const query = new URLSearchParams();
  for (const field of PRODUCT_FILTERS) {
    const value = params.get(field)?.trim();
    if (value) query.set(field, value);
  }
  return query.toString();
}

export function withFilter(params, field, value) {
  const next = new URLSearchParams(params);
  if (value.trim()) next.set(field, value);
  else next.delete(field);
  return next;
}
