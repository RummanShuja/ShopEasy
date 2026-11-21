import { useEffect, useState } from 'react';
import { ArrowRight, Boxes, PackageCheck, ShoppingBag, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOrderStats, listInventory, listOrders } from '../api/adminApi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { OrderMetrics } from './AdminOrdersPage';
import { StatusMessage } from '../components/ui/StatusMessage';
import { StatusBadge, orderDate } from '../components/store/OrderTracking';
import { formatCurrency } from '../utils/formatCurrency';

export function AdminOverviewPage() {
  const { token, handleAuthError } = useAdminAuth();
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([getOrderStats(token, controller.signal), listInventory(token, controller.signal), listOrders(0, token, controller.signal)])
      .then(([stats, products, orders]) => { if (!controller.signal.aborted) setResult({ stats, products, orders }); })
      .catch((error) => { if (!controller.signal.aborted) { handleAuthError(error); setResult({ error }); } });
    return () => controller.abort();
  }, [token, revision, handleAuthError]);
  return <><header className="admin-heading"><div><span className="eyebrow">Your store, at a glance</span><h1>A thoughtful overview.</h1><p>Everything you need to keep care moving.</p></div><Link to="/admin/products" className="button button--primary">Manage inventory <ArrowRight size={16} /></Link></header>
    {result?.error ? <StatusMessage title="Could not load your overview" message={result.error.message} error action={() => setRevision((value) => value + 1)} />
      : <><OrderMetrics stats={result?.stats} />
        <div className="overview-grid">{[[Boxes, 'Products in your catalog', result?.products.length], [PackageCheck, 'Units in stock', result?.products.reduce((sum, product) => sum + product.stock, 0)],
          [TrendingUp, 'Products with low stock', result?.products.filter((product) => product.stock > 0 && product.stock <= 10).length], [ShoppingBag, 'Out of stock', result?.products.filter((product) => product.stock === 0).length]].map(([Icon, title, value]) =>
            <div className="overview-inventory-card" key={title}><Icon size={23} strokeWidth={1.5} /><span>{title}</span><strong>{value ?? '—'}</strong></div>)}</div>
        <section className="inventory-panel"><div className="management-toolbar"><div><h2>Latest orders</h2><p>The most recent activity in your store.</p></div><Link to="/admin/orders" className="back-link">View all orders <ArrowRight size={16} /></Link></div>
          {!result ? <div className="skeleton orders-skeleton" role="status" aria-label="Loading overview" /> : !result.orders.items.length ? <StatusMessage title="Your first order is on its way" message="New checkouts will appear here." />
            : <div className="inventory-table-wrap"><table className="inventory-table"><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>{result.orders.items.slice(0, 5).map((order) =>
              <tr key={order.id}><th scope="row">{order.reference}<span className="table-subtext">{orderDate(order.createdAt)}</span></th><td>{order.customerName}</td><td><StatusBadge status={order.status} /></td><td>{formatCurrency(order.total)}</td></tr>)}</tbody></table></div>}
        </section></>}
  </>;
}
