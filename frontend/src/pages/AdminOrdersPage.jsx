import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Package, RefreshCw, Search } from 'lucide-react';
import { getAdminOrder, getOrderStats, listOrders, updateOrderStatus } from '../api/adminApi';
import { Dialog } from '../components/ui/Dialog';
import { StatusMessage } from '../components/ui/StatusMessage';
import { OrderTracking, StatusBadge, ORDER_STAGES, statusLabel, orderDate } from '../components/store/OrderTracking';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';

export function OrderMetrics({ stats }) {
  return <dl className="order-metrics">{[['total', 'All orders'], ['PENDING', 'Pending'], ['PROCESSING', 'Processing'], ['SHIPPED', 'Shipped'], ['DELIVERED', 'Delivered'], ['CANCELLED', 'Cancelled']].map(([key, title]) =>
    <div key={key} className={`order-metric metric-${key.toLowerCase()}`}><dt>{title}</dt><dd>{stats ? stats[key] : '—'}</dd><Package size={17} /></div>)}</dl>;
}
export function AdminOrdersPage() {
  const { token, handleAuthError } = useAdminAuth();
  const [filters, setFilters] = useState({ search: '', status: '', page: 0 });
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const key = JSON.stringify([filters, revision]);
  const current = result?.key === key ? result : null;
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      Promise.all([listOrders(filters.page, token, controller.signal, filters), getOrderStats(token, controller.signal)])
        .then(([history, stats]) => { if (!controller.signal.aborted) setResult({ key, history, stats }); })
        .catch((error) => { if (!controller.signal.aborted) { handleAuthError(error); setResult({ key, error }); } });
    }, filters.search ? 220 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [filters, key, token, handleAuthError]);
  const refresh = () => setRevision((value) => value + 1);
  return <>
    <header className="admin-heading"><div><span className="eyebrow">Commerce / Order management</span><h1>Every order. Every detail.</h1><p>Follow your customers’ orders from placed to delivered.</p></div>
      <button className="button button--secondary" onClick={refresh}><RefreshCw size={16} /> Refresh</button></header>
    <OrderMetrics stats={current?.stats || result?.stats} />
    <section className="inventory-panel"><div className="management-toolbar"><div><h2>Orders</h2><p>{current?.history ? `${current.history.total} orders found` : 'Your store’s order activity'}</p></div>
      <label className="management-search"><Search size={17} /><input aria-label="Search orders" placeholder="Search reference, customer, email…" maxLength={100} value={filters.search}
        onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 0 })} /></label>
      <select aria-label="Filter order status" className="management-select" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 0 })}>
        <option value="">All statuses</option>{[...ORDER_STAGES, 'CANCELLED'].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></div>
      {current?.error ? <StatusMessage title="Could not load orders" message={current.error.message} error action={refresh} />
        : !current?.history ? <div className="inventory-loading" role="status" aria-label="Loading orders"><div className="skeleton inventory-loading-table" /></div>
        : !current.history.items.length ? <StatusMessage title="No orders found" message="Orders matching your filters will appear here." />
        : <><div className="inventory-table-wrap" role="region" tabIndex={0} aria-label="Orders table"><table className="inventory-table admin-orders-table"><thead><tr>
          <th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col">Amount</th><th scope="col">Items</th><th scope="col">Action</th>
        </tr></thead><tbody>{current.history.items.map((order) => <tr key={order.id} data-order-id={order.id}>
          <th scope="row"><button className="order-reference-button" onClick={() => setSelectedId(order.id)}>{order.reference}</button><span className="table-subtext">{orderDate(order.createdAt)}</span></th>
          <td><strong>{order.customerName}</strong><span className="table-subtext">{order.email}</span></td><td><StatusBadge status={order.status} /></td><td><strong>{formatCurrency(order.total)}</strong></td>
          <td>{order.items.reduce((count, line) => count + line.quantity, 0)}</td><td><button className="button button--secondary" aria-label={`View order ${order.reference}`} onClick={() => setSelectedId(order.id)}>Manage <ArrowRight size={15} /></button></td>
        </tr>)}</tbody></table></div>
        <nav className="order-pagination" aria-label="Order pages"><button className="button button--secondary" disabled={filters.page === 0} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}><ChevronLeft size={16} />Previous</button>
          <span>Page {filters.page + 1} of {current.history.totalPages}</span><button className="button button--secondary" disabled={!current.history.hasNext} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next<ChevronRight size={16} /></button></nav></>}
    </section>
    {selectedId && <AdminOrderDetails key={selectedId} id={selectedId} token={token} onClose={() => setSelectedId(null)} onUpdated={refresh} />}
  </>;
}
function AdminOrderDetails({ id, token, onClose, onUpdated }) {
  const { handleAuthError } = useAdminAuth();
  const notify = useToast();
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    getAdminOrder(id, token, controller.signal).then((order) => { if (!controller.signal.aborted) setResult({ order }); })
      .catch((failure) => { if (!controller.signal.aborted) { handleAuthError(failure); setResult({ error: failure }); } });
    return () => controller.abort();
  }, [id, token, revision, handleAuthError]);
  async function update() {
    setBusy(true); setError('');
    try {
      const order = await updateOrderStatus(id, { status: target, version: result.order.version, note }, token);
      setResult({ order }); setTarget(''); setNote(''); setConfirm(false); onUpdated(); notify(`Order ${order.reference} updated.`);
    } catch (failure) {
      handleAuthError(failure); setError(failure.message); setConfirm(false);
      if (failure.status === 409) { setTarget(''); setRevision((value) => value + 1); }
    } finally { setBusy(false); }
  }
  return <Dialog title={result?.order?.reference || 'Order details'} onClose={onClose} className="admin-order-dialog" busy={busy}>
    <div className="admin-order-content">{!result ? <div className="skeleton orders-skeleton" role="status" aria-label="Loading order" />
      : result.error ? <StatusMessage title="Could not load order" message={result.error.message} error action={() => setRevision((value) => value + 1)} />
      : <><OrderTracking order={result.order} admin />
        <section className="status-update-panel"><div><h3>Update this order</h3><p>Changes apply to this order only and appear in the customer’s tracking history.</p></div>
          {result.order.allowedTransitions.length ? <><label className="form-field">Next status<select aria-label="Next order status" value={target} disabled={busy} onChange={(event) => { setTarget(event.target.value); setConfirm(false); }}>
            <option value="">Select a status</option>{result.order.allowedTransitions.map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></label>
            <label className="form-field">Customer-visible note <span className="field-optional">Optional</span><input maxLength={300} value={note} disabled={busy} onChange={(event) => setNote(event.target.value)} placeholder="Add a helpful order update" /></label>
            {confirm ? <div className="status-confirmation"><p>Change <strong>{result.order.reference}</strong> to <strong>{statusLabel(target)}</strong>?</p>
              {target === 'CANCELLED' && <p>Cancelled orders cannot be reopened. Purchased stock will be returned to inventory.</p>}
              <button className={`button ${target === 'CANCELLED' ? 'button--danger' : 'button--primary'}`} disabled={busy} onClick={update}>{busy ? 'Saving…' : 'Confirm update'}</button>
              <button className="button button--secondary" disabled={busy} onClick={() => setConfirm(false)}>Keep current status</button></div>
              : <button className="button button--primary" disabled={!target || busy} onClick={() => setConfirm(true)}>Review status update <ArrowRight size={16} /></button>}</>
            : <p className="terminal-status">This order is {statusLabel(result.order.status).toLowerCase()}. No further status changes are available.</p>}
          {error && <p className="inline-error" role="alert">{error}</p>}
        </section></>}
    </div>
  </Dialog>;
}
