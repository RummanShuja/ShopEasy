import { ProductCard } from './ProductCard';

export function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="product-grid" role="status" aria-label="Loading products">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="product-card skeleton-card" key={index} aria-hidden="true">
            <div className="skeleton skeleton-image" />
            <div className="product-card-body">
              <div className="skeleton skeleton-line short" /><div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line medium" /><div className="skeleton skeleton-button" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
