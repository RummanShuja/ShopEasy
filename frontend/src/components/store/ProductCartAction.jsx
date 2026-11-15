import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { QuantityControl } from '../ui/QuantityControl';

export function ProductCartAction({ product }) {
  const { items, add, changeQuantity } = useCart();
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
    <div className="product-cart-action" ref={action}>
      {hasQuantity ? (
        <QuantityControl name={product.name} quantity={quantity} showCountLabel
          cannotIncrease={quantity >= product.stock}
          decrease={(event) => {
            restoreFocus.current = quantity === 1 && event.currentTarget.matches(':focus-visible');
            changeQuantity(product.id, -1);
          }}
          increase={() => add(product)} />
      ) : (
        <button type="button" className="button product-add" disabled={product.stock === 0}
          onClick={(event) => {
            restoreFocus.current = event.currentTarget.matches(':focus-visible');
            add(product);
          }}>
          <Plus size={18} aria-hidden="true" /> Add to Cart
        </button>
      )}
    </div>
  );
}
