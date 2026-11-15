import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function StoreFooter() {
  return (
    <footer className="store-footer">
      <div className="container footer-content">
        <Logo />
        <nav aria-label="Footer links">
          <Link to="/#products">Shop products</Link>
          <Link to="/admin">Admin portal</Link>
        </nav>
      </div>
    </footer>
  );
}
