import { ArrowUpRight, ClipboardList, LayoutDashboard, LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from './Logo';

export function AdminSidebar({ onSignOut }) {
  return (
    <aside className="admin-sidebar">
      <Logo />
      <nav aria-label="Admin navigation">
        <NavLink to="/admin" end><LayoutDashboard size={18} /> Inventory</NavLink>
        <NavLink to="/admin/orders"><ClipboardList size={18} /> Orders</NavLink>
        <Link to="/"><ArrowUpRight size={18} /> <span>Storefront</span></Link>
      </nav>
      <button type="button" className="admin-signout" onClick={onSignOut}><LogOut size={17} /> <span>Sign out</span></button>
    </aside>
  );
}
