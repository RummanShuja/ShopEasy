import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { ProductImage } from '../ui/ProductImage';
import { StockStatus } from '../store/StockStatus';

export function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="inventory-table-wrap" tabIndex={0} role="region" aria-label="Scrollable inventory table">
      <table className="inventory-table">
        <thead><tr>
          <th scope="col">Product</th><th scope="col">Category</th><th scope="col">Price</th>
          <th scope="col">Stock</th><th scope="col">Visibility</th><th scope="col">Actions</th>
        </tr></thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <th scope="row"><div className="inventory-product">
                <ProductImage src={product.imageUrl} alt="" />
                <div><strong>{product.name}</strong><span>{product.brand}</span></div>
              </div></th>
              <td>{product.category}</td>
              <td>{formatCurrency(product.price)}</td>
              <td><StockStatus stock={product.stock} includeCount /></td>
              <td><span className={`visibility-badge ${product.active ? 'is-visible' : ''}`}>{product.active ? 'Visible' : 'Hidden'}</span></td>
              <td><div className="table-actions">
                <button className="icon-button" type="button" title="Edit product" aria-label={`Edit ${product.name}`} onClick={() => onEdit(product)}><Pencil size={17} /></button>
                <button className="icon-button danger-icon" type="button" title="Delete product" aria-label={`Delete ${product.name}`} onClick={() => onDelete(product)}><Trash2 size={17} /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
