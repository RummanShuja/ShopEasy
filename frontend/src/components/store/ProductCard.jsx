import { ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ProductImage } from '../ui/ProductImage';
import { PriceDisplay } from './PriceDisplay';
import { RatingStars } from './RatingStars';
import { StockStatus } from './StockStatus';

export function ProductCard({ product }) {
  const { add } = useCart();
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
        <RatingStars rating={product.rating} />
        <div className="product-card-meta">
          <PriceDisplay product={product} />
          <StockStatus stock={product.stock} />
        </div>
        <button type="button" className="button button--soft product-add" disabled={product.stock === 0} onClick={() => add(product)}>
          <ShoppingBag size={16} aria-hidden="true" /> Add to Cart
        </button>
      </div>
    </article>
  );
}
