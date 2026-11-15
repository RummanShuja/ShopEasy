import { useState } from 'react';
import { Dialog } from '../ui/Dialog';

export function DeleteProductDialog({ product, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Delete product?" onClose={onClose} busy={busy} className="delete-dialog">
      <div className="delete-dialog-body">
        <p><strong>{product.name}</strong> will be removed from your inventory.</p>
        {error && <p className="inline-error" role="alert">{error}</p>}
      </div>
      <div className="dialog-actions">
        <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="button button--danger" onClick={confirm} disabled={busy}>{busy ? 'Deleting…' : 'Delete product'}</button>
      </div>
    </Dialog>
  );
}
