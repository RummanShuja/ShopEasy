import { ChevronDown, LayoutDashboard, Search, ShoppingBag } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { withFilter } from '../../utils/catalogQuery';
import { Logo } from './Logo';

export function StoreNavbar({ categories }) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { count, openCart } = useCart();

  function filter(field, value) {
    if (location.pathname === '/') {
      setParams(withFilter(params, field, value), { replace: true, preventScrollReset: true });
      return;
    }
    navigate({ pathname: '/', search: withFilter(new URLSearchParams(), field, value).toString() });
  }

  return (
    <header className="store-header">
      <nav className="container navbar" aria-label="Store navigation">
        <Logo />
        <label className="nav-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Search products</span>
          <input type="search" placeholder="Search products" maxLength={100}
            value={params.get('search') || ''} onChange={(event) => filter('search', event.target.value)} />
        </label>
        <div className="nav-category select-wrap">
          <label className="sr-only" htmlFor="nav-category">Browse by category</label>
          <select id="nav-category" value={params.get('category') || ''} onChange={(event) => filter('category', event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </div>
        <div className="nav-actions">
          <Link className="nav-admin" to="/admin"><LayoutDashboard size={17} aria-hidden="true" /><span>Admin</span></Link>
          <button type="button" className="nav-cart icon-button" aria-label={`Open cart, ${count} items`} onClick={openCart}>
            <ShoppingBag size={22} aria-hidden="true" /><span className="cart-badge" aria-hidden="true">{count}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
