import { ChevronDown, LayoutDashboard, Search, ShoppingBag, X } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { withFilter } from '../../utils/catalogQuery';
import { Logo } from './Logo';

export function StoreNavbar({ categories }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { count, openCart } = useCart();
  const search = params.get('search') || '';

  function filter(field, value) {
    if (location.pathname === '/') {
      navigate({ search: withFilter(params, field, value).toString(), hash: location.hash },
        { replace: true, preventScrollReset: true });
      return;
    }
    navigate({ pathname: '/', search: withFilter(new URLSearchParams(), field, value).toString(), hash: '#products' });
  }

  function submitSearch(event) {
    event.preventDefault();
    if (location.pathname === '/') document.getElementById('products')?.scrollIntoView();
    else navigate('/#products');
  }

  return (
    <header className="store-header">
      <nav className="container navbar" aria-label="Store navigation">
        <Logo />
        <form className="nav-search" role="search" onSubmit={submitSearch}>
          <button className="nav-search-icon" type="submit" aria-label="Go to product results"><Search size={19} aria-hidden="true" /></button>
          <label className="sr-only" htmlFor="catalog-search">Search products</label>
          <input id="catalog-search" type="search" placeholder="Search products" maxLength={100}
            value={search} onChange={(event) => filter('search', event.target.value)} />
          {search && <button type="button" className="nav-search-icon" aria-label="Clear search" onClick={() => filter('search', '')}>
            <X size={16} aria-hidden="true" />
          </button>}
        </form>
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
          <button type="button" className="nav-cart" aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={openCart}>
            <ShoppingBag size={19} aria-hidden="true" /><span className="nav-cart-label">Cart</span>
            <span className="cart-badge" aria-hidden="true">{count}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
