import { Boxes, CircleAlert, Eye, Layers3 } from 'lucide-react';

export function InventorySummary({ products }) {
  const stats = [
    { label: 'Total products', value: products.length, icon: Boxes },
    { label: 'Visible in store', value: products.filter((product) => product.active).length, icon: Eye },
    { label: 'Out of stock', value: products.filter((product) => product.stock === 0).length, icon: CircleAlert },
    { label: 'Categories', value: new Set(products.map((product) => product.category)).size, icon: Layers3 },
  ];
  return (
    <dl className="inventory-stats">
      {stats.map(({ label, value, icon: Icon }) => (
        <div className="inventory-stat" key={label}>
          <span className="inventory-stat-icon"><Icon size={20} aria-hidden="true" /></span>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
