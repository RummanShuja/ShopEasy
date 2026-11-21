import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Package, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useToast } from '../../context/ToastContext';
import { Logo } from './Logo';

export function StoreNavbar({ categories }) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { count, openCart } = useCart();
  const { customer, signOut, restoring } = useCustomerAuth();
  const notify = useToast();
  const [search, setSearch] = useState(params.get('search') || '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const account = useRef(null);
  const category = useRef(null);
  useEffect(() => { setSearch(params.get('search') || ''); }, [params]);
  useEffect(() => { setMobileOpen(false); if (account.current) account.current.open = false; if (category.current) category.current.open = false; }, [location]);
  useEffect(() => {
    const close = (event) => {
      for (const menu of [account.current, category.current]) if (menu && (event.key === 'Escape' || (event.type === 'pointerdown' && !menu.contains(event.target)))) menu.open = false;
    };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);
  function submit(event) {
    event.preventDefault(); const next = new URLSearchParams(location.pathname === '/shop' ? params : undefined);
    if (search.trim()) next.set('search', search.trim()); else next.delete('search');
    navigate(`/shop?${next.toString()}#products`);
  }
  async function logout() {
    setLoggingOut(true);
    try { await signOut(); notify('You have been signed out. Your account cart is saved.'); }
    catch (error) { notify(error.message, 'error'); }
    finally { setLoggingOut(false); }
  }
  return <header className="store-header">
    <div className="announcement">A little care. Every day. <span>Thoughtful essentials for your wellbeing.</span></div>
    <nav className="container navbar" aria-label="Store navigation"><Logo />
      <div className="desktop-links"><NavLink to="/" end>Home</NavLink><NavLink to="/shop">Shop</NavLink>
        <details className="nav-dropdown" ref={category}><summary>Categories <ChevronDown size={14} /></summary><div className="nav-dropdown-panel">
          {categories.map((name) => <Link to={`/shop?category=${encodeURIComponent(name)}#products`} key={name}>{name}</Link>)}<Link to="/shop">All essentials</Link>
        </div></details><Link to="/shop?offersOnly=true#products">Offers</Link><Link to="/shop?category=Vitamins#products">Wellness</Link></div>
      <form className="nav-search" role="search" onSubmit={submit}><button className="nav-search-icon" aria-label="Search products"><Search size={19} /></button>
        <label className="sr-only" htmlFor="catalog-search">Search medicines and health products</label>
        <input id="catalog-search" type="search" placeholder="Search medicines, wellness & more…" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} />
        {search && <button type="button" className="nav-search-icon" aria-label="Clear search" onClick={() => setSearch('')}><X size={16} /></button>}</form>
      <div className="nav-actions">{customer ? <details className="nav-dropdown account-menu" ref={account}>
        <summary aria-label="Your account"><UserRound size={23} strokeWidth={1.5} /><span className="sr-only">Your account</span></summary>
        <div className="nav-dropdown-panel"><div className="account-menu-name">Hello, {customer.name.split(' ')[0]}</div><Link to="/orders"><Package size={16} /> My Orders</Link>
          <button type="button" onClick={logout} disabled={loggingOut}><LogOut size={16} />{loggingOut ? 'Signing out…' : 'Log out'}</button></div>
      </details> : <Link className="nav-account" to="/login" aria-label="Sign in to your account"><UserRound size={23} strokeWidth={1.5} />{restoring && <span className="sr-only">Restoring session</span>}</Link>}
        <button type="button" className="nav-cart" aria-label={`Open cart, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={openCart}>
          <ShoppingBag size={24} strokeWidth={1.5} /><span className="cart-badge" aria-hidden="true">{count}</span></button>
        <button className="icon-button mobile-menu-toggle" aria-expanded={mobileOpen} aria-controls="mobile-navigation" aria-label="Toggle navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={23} /> : <Menu size={23} />}</button>
      </div>
    </nav>
    {mobileOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation"><Link to="/">Home</Link><Link to="/shop">Shop all</Link>
      <Link to="/shop?offersOnly=true#products">Offers</Link>
      {categories.map((name) => <Link key={name} to={`/shop?category=${encodeURIComponent(name)}`}>{name}</Link>)}<Link to="/orders">My orders</Link></nav>}
  </header>;
}
