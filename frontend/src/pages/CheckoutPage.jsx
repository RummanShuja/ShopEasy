import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { placeOrder } from '../api/ordersApi';
import { OrderItems } from '../components/ui/OrderItems';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ATTEMPT_KEY = 'shopeasy-checkout-attempt-v1';
const EMPTY_CUSTOMER = { customerName: '', email: '' };
const CUSTOMER_FIELDS = [
  { name: 'customerName', label: 'Full name', autoComplete: 'name', maxLength: 100 },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email', maxLength: 254 },
];

function readAttempt() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY));
    return saved?.key && Array.isArray(saved.body?.items) && Array.isArray(saved.lines) ? saved : null;
  } catch {
    return null;
  }
}

function storeAttempt(attempt) {
  try {
    if (attempt) sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
    else sessionStorage.removeItem(ATTEMPT_KEY);
  } catch {
    // The active page can still retry the same request in memory.
  }
}

function OrderSummary({ lines, total, children }) {
  return (
    <section className="checkout-panel checkout-summary" aria-label="Order summary">
      <h2><ShoppingBag size={20} /> Order summary</h2>
      <OrderItems items={lines} total={total} />
      {children}
    </section>
  );
}

export function CheckoutPage() {
  const { items, subtotal, openCart, completeOrder, checking, checkError, refresh } = useCart();
  const notify = useToast();
  const fieldId = useId();
  const submitting = useRef(false);
  const confirmationHeading = useRef(null);
  const [attempt, setAttempt] = useState(readAttempt);
  const [customer, setCustomer] = useState(() => attempt ? {
    customerName: attempt.body.customerName,
    email: attempt.body.email,
  } : EMPTY_CUSTOMER);
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mustReview, setMustReview] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (order) confirmationHeading.current?.focus();
  }, [order]);

  const lines = attempt?.lines ?? items.map(({ product, quantity }) => ({
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.discountedPrice,
    lineTotal: Math.round(product.discountedPrice * 100) * quantity / 100,
  }));
  const total = attempt?.total ?? subtotal;

  async function submit(event) {
    event.preventDefault();
    if (submitting.current || mustReview || !lines.length) return;
    let pending = attempt;

    if (!pending) {
      const details = { customerName: customer.customerName.trim(), email: customer.email.trim() };
      const invalid = {};
      if (!details.customerName) invalid.customerName = 'Enter your full name.';
      if (!details.email || event.currentTarget.elements.email.validity.typeMismatch) {
        invalid.email = 'Enter a valid email address.';
      }
      setFields(invalid);
      if (Object.keys(invalid).length > 0) {
        event.currentTarget.elements.namedItem(Object.keys(invalid)[0])?.focus();
        return;
      }

      pending = {
        key: globalThis.crypto.randomUUID(),
        body: { ...details, items: lines.map(({ productId, quantity, unitPrice }) => ({
          productId, quantity, expectedUnitPrice: unitPrice,
        })) },
        lines,
        total,
      };
      storeAttempt(pending);
      setAttempt(pending);
    }

    submitting.current = true;
    setBusy(true);
    setMessage('');
    try {
      const confirmation = await placeOrder(pending.body, pending.key);
      storeAttempt(null);
      setAttempt(null);
      completeOrder(confirmation);
      setOrder(confirmation);
      notify('Order placed.');
    } catch (error) {
      const rejected = error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429;
      if (rejected) {
        storeAttempt(null);
        setAttempt(null);
        setFields(error.fieldErrors);
        setMustReview(error.status === 409 && Boolean(error.fieldErrors.items));
      }
      setMessage(error.message);
      notify(error.message, 'error');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function reviewCart() {
    if (await refresh()) {
      setMustReview(false);
      setMessage('');
    }
  }

  if (order) {
    return (
      <div className="container checkout-page">
        <section className="checkout-panel checkout-confirmation" aria-labelledby="confirmation-heading">
          <span className="status-icon"><Check size={27} /></span>
          <h1 id="confirmation-heading" tabIndex={-1} ref={confirmationHeading}>Order confirmed</h1>
          <p>Thank you, {order.customerName}. Your demo order has been placed.</p>
          <div className="checkout-reference"><span>Order reference</span><strong>{order.reference}</strong></div>
          <Link className="button button--primary" to="/#products">Continue shopping <ArrowRight size={17} /></Link>
        </section>
        <OrderSummary lines={order.items} total={order.total} />
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <Link to="/#products" className="back-link"><ArrowLeft size={17} /> Back to catalog</Link>
      <header className="checkout-heading">
        <h1>Checkout</h1>
        <p>Review your items and place a demo order. No payment is collected.</p>
      </header>
      {!lines.length ? <StatusMessage title="Your cart is empty" message="Add a product to your cart to check out." /> : (
        <form className="checkout-grid" noValidate onSubmit={submit}>
          <section className="checkout-panel checkout-customer" aria-labelledby="customer-heading">
            <h2 id="customer-heading">Guest details</h2>
            {CUSTOMER_FIELDS.map(({ name, label, type = 'text', ...attributes }) => (
              <div key={name} className="form-field">
                <label htmlFor={`${fieldId}-${name}`}>{label}</label>
                <input {...attributes} type={type} id={`${fieldId}-${name}`} name={name}
                  value={customer[name]} readOnly={Boolean(attempt)}
                  onChange={(event) => {
                    setCustomer({ ...customer, [name]: event.target.value });
                    setFields({ ...fields, [name]: undefined });
                  }}
                  aria-invalid={Boolean(fields[name])}
                  aria-describedby={fields[name] ? `${fieldId}-${name}-error` : undefined} />
                {fields[name] && <span className="field-error" id={`${fieldId}-${name}-error`}>{fields[name]}</span>}
              </div>
            ))}
          </section>
          <OrderSummary lines={lines} total={total}>
            {message && <p className="inline-error" role="alert">{message}</p>}
            {attempt && !busy && <p className="checkout-note">Retry this order to recover your confirmation.</p>}
            {mustReview && checkError && !checking && <p className="inline-error" role="alert">Could not refresh the cart. Try again.</p>}
            <div className="checkout-actions">
              {mustReview
                ? <button className="button button--primary" type="button" disabled={checking} onClick={reviewCart}>
                    {checking ? 'Refreshing cart…' : 'Refresh cart'} <ArrowRight size={17} />
                  </button>
                : <button className="button button--primary" type="submit" disabled={busy || checking}>
                    {busy ? 'Placing order…' : attempt ? 'Retry order' : 'Place order'} <ArrowRight size={17} />
                  </button>}
              {!attempt && <button type="button" className="text-button" onClick={openCart}>Edit cart</button>}
            </div>
          </OrderSummary>
        </form>
      )}
    </div>
  );
}
