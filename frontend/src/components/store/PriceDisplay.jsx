import { formatCurrency } from '../../utils/formatCurrency';

export function PriceDisplay({ product, showBadge = false }) {
  const onSale = product.discountPercent > 0;
  return (
    <div className="price-display">
      <strong>{formatCurrency(product.discountedPrice)}</strong>
      {onSale && <del>{formatCurrency(product.price)}</del>}
      {onSale && showBadge && <span className="discount-badge">{product.discountPercent}% OFF</span>}
    </div>
  );
}
