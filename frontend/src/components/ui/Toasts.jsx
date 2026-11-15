import { CheckCircle2, CircleAlert, X } from 'lucide-react';

export function Toasts({ toasts, dismiss, global }) {
  return (
    <div className={global ? "toast-stack toast-stack--global" : "toast-stack"} aria-live="polite" aria-atomic="false">
      {toasts.map(({ id, message, type }) => (
        <div className={`toast toast--${type}`} key={id}>
          {type === 'error' ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
          <span>{message}</span>
          <button className="icon-button" type="button" aria-label="Dismiss notification" onClick={() => dismiss(id)}><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}
