import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { StoreLayout } from './components/layout/StoreLayout';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { StorefrontPage } from './pages/StorefrontPage';
import { CustomerAuthProvider, useCustomerAuth } from './context/CustomerAuthContext';
import { CustomerAuthPage } from './pages/CustomerAuthPage';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';

function RouteScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
      else window.scrollTo({ top: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteScroll />
      <ToastProvider>
        <AdminAuthProvider>
          <CustomerAuthProvider><CartProvider>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<StorefrontPage />} />
                <Route path="shop" element={<StorefrontPage />} />
                <Route path="login" element={<CustomerAuthPage key="login" />} />
                <Route path="register" element={<CustomerAuthPage key="register" register />} />
                <Route path="orders" element={<CustomerOrdersPage />} />
                <Route path="orders/:id" element={<CustomerOrdersPage />} />
                <Route path="products/:id" element={<ProductDetailsPage />} />
                <Route path="checkout" element={<ScopedCheckout />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="admin/login" element={<AdminLoginPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="products" element={<AdminDashboardPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
              </Route>
            </Routes>
          </CartProvider></CustomerAuthProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

function ScopedCheckout() {
  const { customer, restoring, token, sessionError, retrySession } = useCustomerAuth();
  if (restoring || (token && !customer)) return <div className="container account-page" role="status">
    {sessionError || 'Restoring your account. Please wait…'}{sessionError && <button className="text-button" onClick={retrySession}>Retry</button>}</div>;
  return <CheckoutPage key={customer?.id || 'guest'} />;
}
