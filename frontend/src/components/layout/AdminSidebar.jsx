import { ArrowUpRight, LayoutDashboard, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function AdminSidebar({ onSignOut }) {
  return (
    <aside className="admin-sidebar">
      <Logo />
      <nav aria-label="Admin navigation">
        <Link className="admin-nav-current" to="/admin" aria-current="page"><LayoutDashboard size={18} /> Inventory</Link>
        <Link to="/"><ArrowUpRight size={18} /> <span>View storefront</span></Link>
      </nav>
      <button type="button" className="admin-signout" onClick={onSignOut}><LogOut size={17} /> <span>Sign out</span></button>
    </aside>
  );
}
