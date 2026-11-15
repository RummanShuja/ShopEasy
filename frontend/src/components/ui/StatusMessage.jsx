import { CircleAlert, PackageOpen } from 'lucide-react';

export function StatusMessage({ title, message, action, actionLabel = 'Try again', error = false }) {
  const Icon = error ? CircleAlert : PackageOpen;
  return (
    <div className="status-message" role={error ? 'alert' : undefined}>
      <span className="status-icon"><Icon size={24} /></span>
      <h2>{title}</h2>
      {message && <p>{message}</p>}
      {action && <button type="button" className="button button--secondary" onClick={action}>{actionLabel}</button>}
    </div>
  );
}
