export function StockStatus({ stock, includeCount = false }) {
  return (
    <span className={`stock-label ${stock > 0 ? 'stock-label--available' : 'stock-label--empty'}`}>
      <span aria-hidden="true" />
      {stock > 0 ? (includeCount ? `In stock · ${stock} available` : 'In stock') : 'Out of stock'}
    </span>
  );
}
