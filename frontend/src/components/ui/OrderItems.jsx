import { formatCurrency } from '../../utils/formatCurrency';

export function OrderItems({ items, total }) {
  return (
    <>
      <ul className="order-items">
        {items.map((item) => (
          <li key={item.productId}>
            <div>
              <strong>{item.productName}</strong>
              <span>{item.quantity} × {formatCurrency(item.unitPrice)}</span>
            </div>
            <strong>{formatCurrency(item.lineTotal)}</strong>
          </li>
        ))}
      </ul>
      <div className="order-total"><strong>Grand total</strong><strong>{formatCurrency(total)}</strong></div>
    </>
  );
}
