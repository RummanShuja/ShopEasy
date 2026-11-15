import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { ToastViewport } from '../../context/ToastContext';

export function Dialog({ title, children, onClose, className = '', busy = false }) {
  const element = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = element.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function close(event) {
    event.preventDefault();
    if (!busy) onClose();
  }

  return (
    <dialog
      ref={element}
      className={`dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={close}
      onClick={(event) => { if (event.target === event.currentTarget) close(event); }}
    >
      <div className="dialog-shell">
        <div className="dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose} disabled={busy}><X size={21} /></button>
        </div>
        {children}
      </div>
      <ToastViewport />
    </dialog>
  );
}
