import { formatCurrency } from '../../utils/formatCurrency';
import { ProductImage } from './ProductImage';

export function OrderItems({ items, total }) {
  return (
    <>
      <ul className="order-items">
        {items.map((item) => (
          <li key={item.productId}>
            <div className="order-item-main">
              {item.imageUrl && <ProductImage src={item.imageUrl} alt="" />}
              <div className="order-item-copy">
                <strong>{item.productName}</strong>
                <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
              </div>
            </div>
            <strong>{formatCurrency(item.lineTotal)}</strong>
          </li>
        ))}
      </ul>
      <div className="order-total"><strong>Grand total</strong><strong>{formatCurrency(total)}</strong></div>
    </>
  );
}
