import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { getProduct } from '../api/productsApi';
import { useToast } from './ToastContext';

const CART_KEY = 'shopeasy-cart-v1';
const CartContext = createContext(null);

function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    return items.filter((item) => {
      if (typeof item?.product?.id !== 'string' || seen.has(item.product.id)
          || !Number.isInteger(item.quantity) || item.quantity < 1
          || !Number.isInteger(item.product.stock) || item.quantity > item.product.stock
          || !Number.isFinite(item.product.discountedPrice) || item.product.discountedPrice < 0) return false;
      seen.add(item.product.id);
      return true;
    });
  } catch {
    return [];
  }
}

function cartReducer(items, action) {
  switch (action.type) {
    case 'add': {
      const product = action.product;
      if (product.stock < 1) return items;
      const exists = items.some((item) => item.product.id === product.id);
      if (!exists) return [...items, { product, quantity: 1 }];
      return items.map((item) => item.product.id === product.id
        ? { product, quantity: Math.min(product.stock, item.quantity + 1) }
        : item);
    }
    case 'quantity':
      return items.map((item) => item.product.id === action.id
        ? { ...item, quantity: Math.max(1, Math.min(item.product.stock, item.quantity + action.delta)) }
        : item);
    case 'remove':
      return items.filter((item) => item.product.id !== action.id);
    case 'refresh':
      return items.flatMap((item) => {
        if (!action.products.has(item.product.id)) return [item];
        const latest = action.products.get(item.product.id);
        return latest?.stock > 0 ? [{ product: latest, quantity: Math.min(item.quantity, latest.stock) }] : [];
      });
    default:
      return items;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, null, readCart);
  const [isOpen, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const notify = useToast();

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // The current cart remains usable when browser storage is unavailable.
    }
  }, [items]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.product.discountedPrice * 100) * item.quantity, 0) / 100;

  function add(product) {
    const current = items.find((item) => item.product.id === product.id);
    if (product.stock < 1 || current?.quantity >= product.stock) {
      notify('The available stock limit has been reached.', 'error');
      return;
    }
    dispatch({ type: 'add', product });
    notify('Added to your cart.');
  }

  function changeQuantity(id, delta) {
    dispatch({ type: 'quantity', id, delta });
  }

  function remove(id) {
    dispatch({ type: 'remove', id });
    notify('Removed from your cart.');
  }

  async function refresh() {
    setCheckError(false);
    if (!items.length) return;
    setChecking(true);
    const results = await Promise.allSettled(items.map((item) => getProduct(item.product.id)));
    const latest = new Map();
    let changed = false;
    let failed = false;

    results.forEach((result, index) => {
      const item = items[index];
      if (result.status === 'fulfilled') {
        latest.set(item.product.id, result.value);
        changed ||= item.quantity > result.value.stock || item.product.discountedPrice !== result.value.discountedPrice;
      } else if (result.reason.status === 404) {
        latest.set(item.product.id, null);
        changed = true;
      } else {
        failed = true;
      }
    });

    dispatch({ type: 'refresh', products: latest });
    setCheckError(failed);
    setChecking(false);
    if (changed) notify('Your cart was updated to reflect current prices or stock.');
  }

  function openCart() {
    setOpen(true);
    if (!checking) void refresh();
  }

  return (
    <CartContext.Provider value={{
      items, count, subtotal, add, changeQuantity, remove, isOpen, openCart,
      closeCart: () => setOpen(false), checking, checkError, refresh,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
