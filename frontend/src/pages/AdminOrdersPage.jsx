import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { listOrders } from '../api/adminApi';
import { Dialog } from '../components/ui/Dialog';
import { OrderItems } from '../components/ui/OrderItems';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatCurrency } from '../utils/formatCurrency';

const orderDate = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function OrderDetails({ order, onClose }) {
  return (
    <Dialog title="Order details" onClose={onClose} className="order-details-dialog">
      <div className="order-details-content">
        <dl className="order-customer">
          <div><dt>Order reference</dt><dd>{order.reference}</dd></div>
          <div><dt>Placed on</dt><dd><time dateTime={order.createdAt}>{orderDate.format(new Date(order.createdAt))}</time></dd></div>
          <div><dt>Customer</dt><dd>{order.customerName}</dd></div>
          <div><dt>Email</dt><dd>{order.email}</dd></div>
        </dl>
        <h3>Items</h3>
        <OrderItems items={order.items} total={order.total} />
      </div>
      <div className="dialog-actions"><button className="button button--secondary" type="button" onClick={onClose}>Close</button></div>
    </Dialog>
  );
}

export function AdminOrdersPage() {
  const { token, handleAuthError } = useAdminAuth();
  const [request, setRequest] = useState({ page: 0 });
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const current = result?.request === request ? result : null;
  const history = current?.history;

  useEffect(() => {
    const controller = new AbortController();
    listOrders(request.page, token, controller.signal).then((history) => {
      if (!controller.signal.aborted) setResult({ request, history });
    }).catch((error) => {
      if (controller.signal.aborted) return;
      handleAuthError(error);
      setResult({ request, error });
    });
    return () => controller.abort();
  }, [request, token, handleAuthError]);

  return (
    <>
      <header className="admin-heading">
        <div><h1>Order history</h1><p>Completed guest orders, newest first.</p></div>
      </header>
      {current?.error ? (
        <StatusMessage title="Could not load orders" message={current.error.message} error
          action={() => setRequest({ page: request.page })} />
      ) : !history ? (
        <div className="inventory-loading" role="status" aria-label="Loading orders"><div className="skeleton inventory-loading-table" /></div>
      ) : history.total === 0 ? (
        <StatusMessage title="No orders yet" message="Completed checkouts will appear here." />
      ) : (
        <section className="inventory-panel" aria-label="Orders">
          <ul className="order-list">
            {history.items.map((order) => {
              const count = order.items.reduce((total, item) => total + item.quantity, 0);
              return (
                <li key={order.reference} className="order-list-row">
                  <div><strong>{order.reference}</strong><time dateTime={order.createdAt}>{orderDate.format(new Date(order.createdAt))}</time></div>
                  <div><strong>{order.customerName}</strong><span>{count} {count === 1 ? 'item' : 'items'}</span></div>
                  <strong>{formatCurrency(order.total)}</strong>
                  <button className="button button--secondary" type="button" onClick={() => setSelected(order)}
                    aria-label={`View details for ${order.reference}`}>View details <ChevronRight size={16} /></button>
                </li>
              );
            })}
          </ul>
          <nav className="order-pagination" aria-label="Order pages">
            <button type="button" className="button button--secondary" disabled={history.page === 0}
              onClick={() => setRequest({ page: history.page - 1 })}><ChevronLeft size={16} /> Previous</button>
            <span aria-live="polite">Page {history.page + 1} of {history.totalPages} · {history.total} {history.total === 1 ? 'order' : 'orders'}</span>
            <button type="button" className="button button--secondary" disabled={!history.hasNext}
              onClick={() => setRequest({ page: history.page + 1 })}>Next <ChevronRight size={16} /></button>
          </nav>
        </section>
      )}
      {selected && <OrderDetails order={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
