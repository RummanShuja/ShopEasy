import { ArrowUpRight, Boxes, ClipboardList, LayoutDashboard, Leaf, LogOut } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Logo } from './Logo';

export function AdminSidebar({ onSignOut }) {
  return <aside className="admin-sidebar"><Logo /><span className="admin-workspace-label">Store workspace</span>
    <nav aria-label="Admin navigation"><NavLink to="/admin" end><LayoutDashboard size={19} /> Overview</NavLink>
      <NavLink to="/admin/orders"><ClipboardList size={19} /> Orders</NavLink><NavLink to="/admin/products"><Boxes size={19} /> Products & stock</NavLink>
      <Link to="/"><ArrowUpRight size={19} /> View storefront</Link></nav>
    <div className="admin-sidebar-note"><Leaf size={25} strokeWidth={1.2} /><p>A little care.<br />A better every day.</p><span>The ShopEasy way.</span></div>
    <button className="admin-signout" onClick={onSignOut}><LogOut size={17} /> Sign out</button>
  </aside>;
}
