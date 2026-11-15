import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { Dialog } from '../ui/Dialog';
import { ProductImage } from '../ui/ProductImage';

export function CartDrawer() {
  const { items, count, subtotal, changeQuantity, remove, closeCart, checking, checkError, refresh } = useCart();

  return (
    <Dialog className="cart-drawer" title={`Your cart (${count})`} onClose={closeCart}>
      <div className="cart-content">
        {checking && <p className="cart-note" role="status">Checking prices and stock…</p>}
        {checkError && <div className="cart-note" role="alert">
          Prices and stock could not be refreshed. <button className="text-button" type="button" onClick={refresh}>Retry</button>
        </div>}
        {items.length === 0 ? (
          <div className="cart-empty">
            <span className="status-icon"><ShoppingBag size={28} /></span>
            <h3>Your cart is empty</h3>
            <button type="button" className="button button--primary" onClick={closeCart}>Continue shopping</button>
          </div>
        ) : (
          <ul className="cart-items">
            {items.map(({ product, quantity }) => (
              <li className="cart-item" key={product.id}>
                <ProductImage src={product.imageUrl} alt="" />
                <div className="cart-item-content">
                  <h3>{product.name}</h3>
                  <p>{formatCurrency(product.discountedPrice)} each</p>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button type="button" aria-label={`Decrease quantity of ${product.name}`} disabled={quantity <= 1 || checking}
                        onClick={() => changeQuantity(product.id, -1)}><Minus size={15} /></button>
                      <output aria-label="Quantity">{quantity}</output>
                      <button type="button" aria-label={`Increase quantity of ${product.name}`}
                        disabled={quantity >= product.stock || checking || checkError}
                        onClick={() => changeQuantity(product.id, 1)}><Plus size={15} /></button>
                    </div>
                    <button type="button" className="icon-button cart-remove" aria-label={`Remove ${product.name}`}
                      onClick={() => remove(product.id)}><Trash2 size={17} /></button>
                  </div>
                  {quantity === product.stock && <span className="cart-limit">Available stock limit reached</span>}
                </div>
                <strong>{formatCurrency(Math.round(product.discountedPrice * 100) * quantity / 100)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
      {items.length > 0 && (
        <div className="cart-totals">
          <div><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div><strong>Grand total</strong><strong>{formatCurrency(subtotal)}</strong></div>
          <Link className="button button--primary" to="/checkout" onClick={closeCart}>
            Checkout <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </Dialog>
  );
}
