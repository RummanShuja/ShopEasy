import { Link } from 'react-router-dom';
import { StatusMessage } from '../components/ui/StatusMessage';

export function NotFoundPage() {
  return (
    <div className="container not-found">
      <StatusMessage title="Page not found" message="The page you requested may have moved." />
      <Link className="button button--primary" to="/">Back to the store</Link>
    </div>
  );
}
