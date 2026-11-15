import { Link, useLocation } from 'react-router-dom';
import { ProductImage } from '../ui/ProductImage';
import { PriceDisplay } from './PriceDisplay';
import { ProductCartAction } from './ProductCartAction';
import { RatingStars } from './RatingStars';
import { StockStatus } from './StockStatus';

export function ProductCard({ product }) {
  const { search } = useLocation();
  const details = `/products/${encodeURIComponent(product.id)}`;
  const linkState = { fromSearch: search };
  return (
    <article className="product-card">
      <Link to={details} state={linkState} className="product-card-photo" tabIndex={-1} aria-hidden="true">
        <ProductImage src={product.imageUrl} alt="" />
        {product.discountPercent > 0 && <span className="discount-badge">{product.discountPercent}% OFF</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-brand">{product.brand}</p>
        <h3><Link to={details} state={linkState}>{product.name}</Link></h3>
        <div className="product-card-meta">
          <RatingStars rating={product.rating} />
          <StockStatus stock={product.stock} />
        </div>
        <PriceDisplay product={product} />
        <ProductCartAction product={product} />
      </div>
    </article>
  );
}
