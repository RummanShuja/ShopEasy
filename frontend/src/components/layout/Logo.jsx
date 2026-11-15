import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="ShopEasy home">
      <span className="logo-mark"><Plus size={23} strokeWidth={3} aria-hidden="true" /></span>
      <span>Shop<span className="logo-accent">Easy</span></span>
    </Link>
  );
}
