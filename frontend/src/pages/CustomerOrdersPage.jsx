import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Package, RefreshCw } from 'lucide-react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { request } from '../api/http';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { StatusMessage } from '../components/ui/StatusMessage';
import { OrderTracking, StatusBadge, orderDate } from '../components/store/OrderTracking';
import { formatCurrency } from '../utils/formatCurrency';

export function CustomerAccountGate({ children }) {
  const { customer, token, restoring, sessionError, retrySession } = useCustomerAuth();
  const location = useLocation();
  if (restoring) return <div className="container account-page"><StatusMessage title="Welcome back" message="Restoring your session…" /></div>;
  if (sessionError && token) return <div className="container account-page"><StatusMessage title="Could not restore your account" message={sessionError} error action={retrySession} /></div>;
  if (!customer) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
export function CustomerOrdersPage() { return <CustomerAccountGate><OrdersContent /></CustomerAccountGate>; }
function OrdersContent() {
  const { token, customer } = useCustomerAuth();
  const { id } = useParams();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${customer.id}:${id || 'list'}:${page}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    request(id ? `/api/orders/${encodeURIComponent(id)}` : `/api/orders?page=${page}&size=10`, { token, signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setResult({ key, data }); })
      .catch((error) => { if (!controller.signal.aborted) setResult({ key, error }); });
    return () => controller.abort();
  }, [id, page, token, key]);
  const current = result?.key === key ? result : null;
  return <div className="container account-page">
    <Link className="back-link" to={id ? '/orders' : '/shop'}><ArrowLeft size={16} />{id ? 'All orders' : 'Back to the shop'}</Link>
    <header className="account-page-heading"><div><span className="eyebrow">Your account / {id ? 'Order tracking' : 'My orders'}</span>
      <h1>{id ? 'A little care, on its way.' : 'Your care, collected.'}</h1><p>{id ? current?.data?.reference || 'Order details & tracking' : `Hello, ${customer.name.split(' ')[0]}. Find your orders and follow every step here.`}</p></div>
      <button type="button" className="button button--secondary" onClick={() => setRevision((value) => value + 1)}><RefreshCw size={16} /> Refresh</button></header>
    {!current ? <div className="skeleton orders-skeleton" role="status" aria-label="Loading orders" />
      : current.error ? <StatusMessage title="Could not load your order" message={current.error.message} error action={() => setRevision((value) => value + 1)} />
      : id ? <OrderTracking order={current.data} />
      : !current.data.items.length ? <StatusMessage title="Your next chapter of care starts here" message="You haven't placed an order yet. Explore everyday essentials for you and your home." />
      : <><div className="customer-orders">{current.data.items.map((order) => <article className="customer-order" key={order.id}>
        <header><div><span className="eyebrow">{order.reference}</span><p>{orderDate(order.createdAt)}</p></div><StatusBadge status={order.status} /></header>
        <div className="customer-order-body"><span className="order-package"><Package size={29} /></span><div><h2>{order.items.map((item) => item.productName).join(', ')}</h2>
          <p>{order.items.reduce((count, item) => count + item.quantity, 0)} items · {formatCurrency(order.total)}</p></div>
          <Link className="button button--secondary" to={`/orders/${encodeURIComponent(order.id)}`}>Track order <ArrowRight size={16} /></Link></div></article>)}</div>
        <nav className="order-pagination" aria-label="Order pages"><button className="button button--secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page + 1} of {current.data.totalPages}</span><button className="button button--secondary" disabled={!current.data.hasNext} onClick={() => setPage(page + 1)}>Next</button></nav></>}
  </div>;
}
