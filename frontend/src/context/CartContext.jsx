import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getProduct } from '../api/productsApi';
import { request } from '../api/http';
import { useCustomerAuth } from './CustomerAuthContext';
import { useToast } from './ToastContext';

const CART_KEY = 'shopeasy-cart-v1';
const MERGE_KEY = 'shopeasy-guest-merge';
const CartContext = createContext(null);
function readGuest() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const seen = new Set();
    return Array.isArray(items) ? items.filter((line) => {
      if (!line?.product?.id || seen.has(line.product.id) || !Number.isInteger(line.quantity) || line.quantity < 1
        || !Number.isFinite(line.product.discountedPrice)) return false;
      seen.add(line.product.id); return true;
    }) : [];
  } catch { return []; }
}
function saveGuest(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); localStorage.removeItem(MERGE_KEY); } catch { /* The cart remains in memory. */ }
}
function mergeId() {
  try {
    const existing = localStorage.getItem(MERGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID(); localStorage.setItem(MERGE_KEY, id); return id;
  } catch { return crypto.randomUUID(); }
}

export function CartProvider({ children }) {
  const auth = useCustomerAuth();
  const notify = useToast();
  const scope = auth.token ? auth.customer?.id || 'restoring' : 'guest';
  const [state, setState] = useState(() => ({ scope: 'guest', items: readGuest() }));
  const [isOpen, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  const confirmed = useRef(new Set());
  const activeScope = useRef(scope);
  useEffect(() => { activeScope.current = scope; }, [scope]);
  const items = state.scope === scope ? state.items : [];
  const report = useCallback((result) => {
    if (result.adjustments?.length) notify(result.adjustments.join(' '));
  }, [notify]);

  useEffect(() => {
    if (auth.restoring || scope === 'restoring') return undefined;
    const controller = new AbortController();
    if (scope === 'guest') { setState({ scope, items: readGuest() }); setCheckError(false); setChecking(false); return undefined; }
    setChecking(true); setCheckError(false);
    const guest = readGuest();
    const pending = guest.length
      ? request('/api/cart/merge', { method: 'POST', token: auth.token, signal: controller.signal,
          body: { mergeId: mergeId(), items: guest.map((line) => ({ productId: line.product.id, quantity: line.quantity })) } })
      : request('/api/cart', { token: auth.token, signal: controller.signal });
    pending.then((result) => {
      if (controller.signal.aborted) return;
      if (guest.length) saveGuest([]);
      setState({ scope, items: result.items }); report(result); setChecking(false);
    }).catch((error) => {
      if (controller.signal.aborted) return;
      setChecking(false); setCheckError(true); notify(error.message, 'error');
    });
    return () => controller.abort();
  }, [auth.token, auth.restoring, scope, revision, notify, report]);

  async function update(product, quantity) {
    if (lock.current || checking || checkError || auth.restoring || scope === 'restoring' || (scope !== 'guest' && state.scope !== scope)) return false;
    if (quantity > product.stock) { notify('The available stock limit has been reached.', 'error'); return false; }
    lock.current = true; setBusy(true);
    const owner = scope;
    try {
      if (auth.token) {
        const result = await request(`/api/cart/items/${encodeURIComponent(product.id)}`, {
          method: 'PUT', token: auth.token, body: { quantity: Math.max(0, quantity) },
        });
        if (activeScope.current === owner) { setState({ scope: owner, items: result.items }); report(result); }
      } else {
        const next = items.filter((line) => line.product.id !== product.id);
        if (quantity > 0) next.push({ product, quantity });
        saveGuest(next); setState({ scope: 'guest', items: next });
      }
      return true;
    } catch (error) { notify(error.message, 'error'); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function add(product) {
    const current = items.find((line) => line.product.id === product.id);
    if (product.stock < 1) { notify('This product is out of stock.', 'error'); return false; }
    const success = await update(product, (current?.quantity || 0) + 1);
    if (success && !current) notify('Added to your cart.');
    return success;
  }
  function changeQuantity(id, delta) {
    const line = items.find((item) => item.product.id === id);
    return line ? update(line.product, line.quantity + delta) : false;
  }
  async function remove(id) {
    const line = items.find((item) => item.product.id === id);
    if (line && await update(line.product, 0)) notify('Removed from your cart.');
  }
  async function refresh() {
    if (checking || busy || auth.restoring) return false;
    if (scope !== 'guest' && state.scope !== scope) { setRevision((value) => value + 1); return false; }
    setChecking(true); setCheckError(false);
    const owner = scope;
    try {
      if (auth.token) {
        const result = await request('/api/cart', { token: auth.token });
        if (activeScope.current === owner) { setState({ scope: owner, items: result.items }); report(result); }
      } else {
        const results = await Promise.allSettled(items.map((line) => getProduct(line.product.id)));
        let failed = false; let changed = false;
        const next = results.flatMap((result, index) => {
          const line = items[index];
          if (result.status === 'rejected') {
            if (result.reason.status === 404) { changed = true; return []; }
            failed = true; return [line];
          }
          const product = result.value;
          const quantity = Math.min(line.quantity, product.stock);
          changed ||= quantity !== line.quantity || product.discountedPrice !== line.product.discountedPrice;
          return quantity > 0 ? [{ product, quantity }] : [];
        });
        if (activeScope.current === owner) { if (changed) saveGuest(next); setState({ scope: owner, items: next }); setCheckError(failed); }
        if (changed) notify('Your cart was updated to reflect current prices or stock.');
        return !failed;
      }
      return true;
    } catch (error) { setCheckError(true); notify(error.message, 'error'); return false; }
    finally { setChecking(false); }
  }
  async function completeOrder(order) {
    if (confirmed.current.has(order.reference)) return;
    confirmed.current.add(order.reference);
    if (auth.token) { await refresh(); return; }
    const next = items.flatMap((line) => {
      const quantity = line.quantity - (order.items.find((saved) => saved.productId === line.product.id)?.quantity || 0);
      return quantity > 0 ? [{ ...line, quantity }] : [];
    });
    saveGuest(next); setState({ scope: 'guest', items: next });
  }
  return <CartContext.Provider value={{ items, count: items.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: items.reduce((sum, line) => sum + Math.round(line.product.discountedPrice * 100) * line.quantity, 0) / 100,
    add, changeQuantity, remove, isOpen, openCart: () => { setOpen(true); void refresh(); }, closeCart: () => setOpen(false),
    checking: checking || auth.restoring || scope === 'restoring', checkError, busy, refresh, completeOrder,
    retrySync: () => { if (state.scope !== scope || (auth.token && readGuest().length)) setRevision((value) => value + 1); else void refresh(); },
    ready: state.scope === scope && !checking && !checkError,
  }}>{children}</CartContext.Provider>;
}
export function useCart() { return useContext(CartContext); }
