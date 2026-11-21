import { Leaf, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link className="logo" to="/" aria-label="ShopEasy home">
      <span className="logo-mark"><Plus size={33} strokeWidth={4} aria-hidden="true" /><Leaf size={19} strokeWidth={1.5} className="logo-leaf" aria-hidden="true" /></span>
      <span>Shop<span className="logo-accent">Easy</span></span>
    </Link>
  );
}
