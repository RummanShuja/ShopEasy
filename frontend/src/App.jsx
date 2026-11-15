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
          <CartProvider>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<StorefrontPage />} />
                <Route path="products/:id" element={<ProductDetailsPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="admin/login" element={<AdminLoginPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
              </Route>
            </Routes>
          </CartProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
