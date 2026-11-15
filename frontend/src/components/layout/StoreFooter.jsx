import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="container footer-content">
        <Logo />
        <p>Pharmacy and wellness essentials.</p>
        <Link to="/admin">Admin portal</Link>
      </div>
    </footer>
  );
}
