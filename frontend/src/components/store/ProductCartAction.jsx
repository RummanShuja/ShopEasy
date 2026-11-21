import { useEffect, useRef } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { QuantityControl } from '../ui/QuantityControl';

export function ProductCartAction({ product, details = false }) {
  const { items, add, changeQuantity, openCart, busy, checking, ready } = useCart();
  const quantity = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const hasQuantity = quantity > 0;
  const action = useRef(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (restoreFocus.current) {
      restoreFocus.current = false;
      action.current?.querySelector('button')?.focus();
    }
  }, [hasQuantity]);

  return (
    <div className={`product-cart-action${details ? ' details-cart-action' : ''}`} ref={action} aria-busy={busy}>
      {hasQuantity ? (
        <QuantityControl name={product.name} quantity={quantity} showCountLabel
          cannotIncrease={quantity >= product.stock || busy || checking || !ready}
          cannotDecrease={busy || checking || !ready}
          decrease={(event) => {
            restoreFocus.current = quantity === 1 && event.currentTarget.matches(':focus-visible');
            changeQuantity(product.id, -1);
          }}
          increase={() => add(product)} />
      ) : (
        <button type="button" className="button product-add" disabled={product.stock === 0 || busy || checking || !ready}
          onClick={(event) => {
            restoreFocus.current = event.currentTarget.matches(':focus-visible');
            add(product);
          }}>
          <ShoppingBag size={16} aria-hidden="true" /> {product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
        </button>
      )}
      {details && hasQuantity && <button type="button" className="button button--primary go-to-cart" onClick={openCart}>Go to Cart <ArrowRight size={18} /></button>}
    </div>
  );
}
