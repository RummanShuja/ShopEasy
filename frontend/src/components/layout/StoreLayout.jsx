import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { listCategories } from '../../api/productsApi';
import { useCart } from '../../context/CartContext';
import { CartDrawer } from '../store/CartDrawer';
import { StoreFooter } from './StoreFooter';
import { StoreNavbar } from './StoreNavbar';

export function StoreLayout() {
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(false);
  const [revision, setRevision] = useState(0);
  const { isOpen } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setCategories(data);
      setCategoryError(false);
    }).catch(() => {
      if (!controller.signal.aborted) setCategoryError(true);
    });
    return () => controller.abort();
  }, [revision]);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <StoreNavbar categories={categories} />
      <main id="main-content">
        <Outlet context={{ categories, categoryError, retryCategories: () => setRevision((value) => value + 1) }} />
      </main>
      <StoreFooter />
      {isOpen && <CartDrawer />}
    </div>
  );
}
