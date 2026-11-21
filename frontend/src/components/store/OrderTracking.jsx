import { Check, Clock3, Package, Truck, XCircle } from 'lucide-react';
import { DeliveryAddress } from '../ui/DeliveryAddress';
import { OrderItems } from '../ui/OrderItems';

export const ORDER_STAGES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
export const statusLabel = (status = 'PENDING') => ({ PENDING: 'Order placed', CONFIRMED: 'Confirmed', PROCESSING: 'Processing',
  SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' })[status] || status;
export const orderDate = (date) => date ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)) : '';
export function StatusBadge({ status = 'PENDING' }) {
  return <span className={`order-status status-${status.toLowerCase()}`}><span />{statusLabel(status)}</span>;
}
export function OrderTracking({ order, admin = false }) {
  const status = order.status || 'PENDING';
  const active = ORDER_STAGES.indexOf(status);
  const cancelled = status === 'CANCELLED';
  const history = order.statusHistory || [];
  return <div className="tracking-content">
    <section className={`tracking-banner${cancelled ? ' tracking-cancelled' : ''}`}>
      <span className="tracking-banner-icon">{cancelled ? <XCircle size={28} /> : status === 'DELIVERED' ? <Check size={28} /> : <Package size={28} />}</span>
      <div><span className="eyebrow">Current order status</span><h2>{statusLabel(status)}</h2>
        <p>{cancelled ? 'This order has been cancelled.' : status === 'DELIVERED' ? 'Your order has been marked as delivered.' : 'Every step of your care, all in one place.'}</p></div><StatusBadge status={status} />
    </section>
    {!cancelled && <ol className="tracking-progress" aria-label="Order progress">{ORDER_STAGES.map((stage, index) => {
      const timestamp = history.find((entry) => entry.status === stage)?.timestamp || (stage === 'PENDING' ? order.createdAt : null);
      return <li key={stage} className={index < active ? 'is-complete' : index === active ? 'is-active' : ''} aria-current={index === active ? 'step' : undefined}>
        <span className="tracking-step">{index < active ? <Check size={16} /> : index === active ? <Truck size={17} /> : <span>{index + 1}</span>}</span>
        <strong>{statusLabel(stage)}</strong>{timestamp && <time dateTime={timestamp}>{orderDate(timestamp)}</time>}</li>;
    })}</ol>}
    <div className="order-detail-grid">
      <section className="checkout-panel"><h2>Your essentials</h2><OrderItems items={order.items} total={order.total} /></section>
      <section className="checkout-panel"><h2>Delivery details</h2><p className="delivery-name">{order.customerName}</p>
        {order.deliveryAddress ? <DeliveryAddress address={order.deliveryAddress} /> : <p className="muted">No delivery address recorded for this order.</p>}
        {order.phone && <p className="delivery-contact">{order.phone}</p>}<p className="delivery-contact">{order.email}</p>
        <div className="order-detail-meta"><span>Placed on</span><strong>{orderDate(order.createdAt)}</strong></div>
        {admin && <div className="order-detail-meta"><span>Order ID</span><code>{order.id}</code></div>}
      </section>
    </div>
    <section className="checkout-panel tracking-history"><h2><Clock3 size={19} /> Order updates</h2>
      {history.length ? <ol>{[...history].reverse().map((entry, index) => <li key={`${entry.timestamp}-${index}`}>
        <span className="history-dot" /><div><strong>{statusLabel(entry.status)}</strong><p>{entry.note}</p></div>
        <time dateTime={entry.timestamp}>{orderDate(entry.timestamp)}</time></li>)}</ol>
        : <p className="legacy-note">Tracking updates were not recorded for this earlier order. Its current status is shown above.</p>}
    </section>
  </div>;
}
