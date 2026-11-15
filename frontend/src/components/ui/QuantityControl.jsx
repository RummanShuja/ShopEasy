import { Minus, Plus } from 'lucide-react';

export function QuantityControl({ name, quantity, decrease, increase, cannotDecrease, cannotIncrease, showCountLabel }) {
  return (
    <div className={`quantity-control${showCountLabel ? ' product-quantity' : ''}`}
      role="group" aria-label={`Cart quantity for ${name}`}>
      <button type="button" aria-label={`Decrease quantity of ${name}`} disabled={cannotDecrease} onClick={decrease}>
        <Minus size={17} aria-hidden="true" />
      </button>
      <output aria-label="Quantity in cart" aria-live="polite">
        <strong>{quantity}</strong>{showCountLabel && <span aria-hidden="true">in cart</span>}
      </output>
      <button type="button" aria-label={`Increase quantity of ${name}`} disabled={cannotIncrease} onClick={increase}>
        <Plus size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
