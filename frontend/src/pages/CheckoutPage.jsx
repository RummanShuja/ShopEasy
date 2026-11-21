import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, ShoppingBag, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { placeOrder } from '../api/ordersApi';
import { DeliveryAddress } from '../components/ui/DeliveryAddress';
import { OrderItems } from '../components/ui/OrderItems';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const ATTEMPT_KEY = 'shopeasy-checkout-attempt-v1';
const EMPTY_ADDRESS = { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' };
const CUSTOMER_FIELDS = [
  { name: 'customerName', label: 'Full name', autoComplete: 'name', maxLength: 100, wide: true },
  { name: 'email', label: 'Email address', type: 'email', autoComplete: 'email', maxLength: 254 },
  { name: 'phone', label: 'Phone number', type: 'tel', autoComplete: 'tel', maxLength: 25 },
];
const ADDRESS_FIELDS = [
  { name: 'line1', label: 'Street address', autoComplete: 'shipping address-line1', maxLength: 120, wide: true },
  { name: 'line2', label: 'Apartment, suite, or landmark', autoComplete: 'shipping address-line2', maxLength: 120, wide: true, optional: true },
  { name: 'city', label: 'City', autoComplete: 'shipping address-level2', maxLength: 80 },
  { name: 'state', label: 'State or region', autoComplete: 'shipping address-level1', maxLength: 80 },
  { name: 'postalCode', label: 'PIN or postal code', autoComplete: 'shipping postal-code', maxLength: 16 },
  { name: 'country', label: 'Country', autoComplete: 'shipping country-name', maxLength: 80 },
];

function readAttempt(owner) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ATTEMPT_KEY));
    return (saved?.owner || 'guest') === owner && saved?.key && Array.isArray(saved.body?.items) && Array.isArray(saved.lines) ? saved : null;
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

function CheckoutFields({ definitions, values, errors, readOnly, prefix = '', onChange }) {
  const fieldId = useId();
  return (
    <div className="checkout-fields">
      {definitions.map(({ name, label, type = 'text', wide, optional, ...attributes }) => {
        const field = prefix + name;
        const id = `${fieldId}-${name}`;
        const error = errors[field];
        return (
          <div key={name} className={`form-field${wide ? ' form-span' : ''}`}>
            <label htmlFor={id}>{label}{optional && <span className="field-optional">Optional</span>}</label>
            <input {...attributes} type={type} id={id} name={field} value={values[name]}
              readOnly={readOnly} required={!optional} onChange={(event) => onChange(name, event.target.value)}
              aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
            {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutPage() {
  const { items, subtotal, openCart, completeOrder, checking, checkError, refresh, busy: cartBusy, ready } = useCart();
  const { customer: profile, token } = useCustomerAuth();
  const notify = useToast();
  const submitting = useRef(false);
  const confirmationHeading = useRef(null);
  const [attempt, setAttempt] = useState(() => readAttempt(profile?.id || 'guest'));
  const [customer, setCustomer] = useState(() => ({
    customerName: attempt?.body.customerName ?? profile?.name ?? '',
    email: attempt?.body.email ?? profile?.email ?? '',
    phone: attempt?.body.phone ?? '',
  }));
  const [address, setAddress] = useState(() => ({ ...EMPTY_ADDRESS, ...attempt?.body.deliveryAddress }));
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
    imageUrl: product.imageUrl,
    quantity,
    unitPrice: product.discountedPrice,
    lineTotal: Math.round(product.discountedPrice * 100) * quantity / 100,
  }));
  const total = attempt?.total ?? subtotal;

  function updateContact(name, value) {
    setCustomer((current) => ({ ...current, [name]: value }));
    setFields((current) => ({ ...current, [name]: undefined }));
  }

  function updateAddress(name, value) {
    setAddress((current) => ({ ...current, [name]: value }));
    setFields((current) => ({ ...current, [`deliveryAddress.${name}`]: undefined, deliveryAddress: undefined }));
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current || mustReview || !lines.length || checking || cartBusy || !ready) return;
    let pending = attempt;

    if (!pending) {
      const details = {
        customerName: customer.customerName.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        deliveryAddress: Object.fromEntries(Object.entries(address).map(([field, value]) => [field, value.trim()])),
      };
      const invalid = {};
      if (!details.customerName) invalid.customerName = 'Enter your full name.';
      if (!details.email || event.currentTarget.elements.email.validity.typeMismatch) {
        invalid.email = 'Enter a valid email address.';
      }
      const digitCount = details.phone.replace(/[^0-9]/g, '').length;
      if (!/^\+?[0-9(). -]{7,24}$/.test(details.phone) || digitCount < 7 || digitCount > 15) {
        invalid.phone = 'Enter a phone number with 7 to 15 digits.';
      }
      for (const { name, label, optional } of ADDRESS_FIELDS) {
        if (!optional && !details.deliveryAddress[name]) {
          invalid[`deliveryAddress.${name}`] = `Enter your ${label.toLowerCase()}.`;
        }
      }
      setFields(invalid);
      if (Object.keys(invalid).length > 0) {
        event.currentTarget.elements.namedItem(Object.keys(invalid)[0])?.focus();
        return;
      }

      pending = {
        owner: profile?.id || 'guest',
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
      const confirmation = await placeOrder(pending.body, pending.key, token);
      storeAttempt(null);
      setAttempt(null);
      await completeOrder(confirmation);
      setOrder(confirmation);
      notify('Order placed.');
    } catch (error) {
      const rejected = error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429;
      if (rejected) {
        storeAttempt(null);
        setAttempt(null);
        setFields(error.fieldErrors || {});
        setMustReview(error.status === 409 && Boolean(error.fieldErrors?.items));
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
      <div className="container checkout-page checkout-complete">
        <section className="checkout-panel checkout-confirmation" aria-labelledby="confirmation-heading">
          <span className="status-icon"><Check size={27} /></span>
          <h1 id="confirmation-heading" tabIndex={-1} ref={confirmationHeading}>Order confirmed</h1>
          <p>Thank you, {order.customerName}. Your demo order has been placed.</p>
          <div className="checkout-reference"><span>Order reference</span><strong>{order.reference}</strong></div>
          {order.deliveryAddress && (
            <div className="confirmation-delivery">
              <h2><MapPin size={18} aria-hidden="true" /> Delivery address</h2>
              <DeliveryAddress address={order.deliveryAddress} />
              {order.phone && <p>{order.phone}</p>}
            </div>
          )}
          <Link className="button button--primary" to="/#products">Continue shopping <ArrowRight size={17} /></Link>
          {profile && <Link className="button button--secondary" to={`/orders/${encodeURIComponent(order.id)}`}>Track your order <ArrowRight size={17} /></Link>}
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
        <p>Enter your contact and delivery details, then review your order.</p>
      </header>
      {!lines.length ? <StatusMessage title="Your cart is empty" message="Add a product to your cart to check out." /> : (
        <form className="checkout-grid" noValidate onSubmit={submit}>
          <div className="checkout-details">
            <section className="checkout-panel checkout-customer" aria-labelledby="customer-heading">
              <h2 id="customer-heading"><UserRound size={19} aria-hidden="true" /> Contact details</h2>
              <CheckoutFields definitions={CUSTOMER_FIELDS} values={customer} errors={fields} readOnly={Boolean(attempt)}
                onChange={updateContact} />
            </section>
            {(!attempt || attempt.body.deliveryAddress) && (
              <section className="checkout-panel checkout-customer" aria-labelledby="delivery-heading">
                <h2 id="delivery-heading"><MapPin size={19} aria-hidden="true" /> Delivery address</h2>
                {fields.deliveryAddress && <p className="field-error" role="alert">{fields.deliveryAddress}</p>}
                <CheckoutFields definitions={ADDRESS_FIELDS} values={address} errors={fields} readOnly={Boolean(attempt)}
                  prefix="deliveryAddress." onChange={updateAddress} />
              </section>
            )}
          </div>
          <OrderSummary lines={lines} total={total}>
            {message && <p className="inline-error" role="alert">{message}</p>}
            {attempt && !busy && <p className="checkout-note">Retry this order to recover your confirmation.</p>}
            {mustReview && checkError && !checking && <p className="inline-error" role="alert">Could not refresh the cart. Try again.</p>}
            <div className="checkout-actions">
              {mustReview
                ? <button className="button button--primary" type="button" disabled={checking} onClick={reviewCart}>
                    {checking ? 'Refreshing cart…' : 'Refresh cart'} <ArrowRight size={17} />
                  </button>
                : <button className="button button--primary" type="submit" disabled={busy || checking || cartBusy || !ready}>
                    {busy ? 'Placing order…' : attempt ? 'Retry order' : 'Place order'} <ArrowRight size={17} />
                  </button>}
              {!attempt && <button type="button" className="text-button" onClick={openCart}>Edit cart</button>}
            </div>
            <p className="checkout-demo">Demo checkout</p>
          </OrderSummary>
        </form>
      )}
    </div>
  );
}
