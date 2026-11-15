import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listInventory } from '../api/adminApi';
import { createProduct, deleteProduct, updateProduct } from '../api/productsApi';
import { DeleteProductDialog } from '../components/admin/DeleteProductDialog';
import { InventorySummary } from '../components/admin/InventorySummary';
import { ProductFormModal } from '../components/admin/ProductFormModal';
import { ProductTable } from '../components/admin/ProductTable';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';

export function AdminDashboardPage() {
  const { token, handleAuthError } = useAdminAuth();
  const notify = useToast();
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    listInventory(token, controller.signal).then((products) => {
      if (!controller.signal.aborted) setInventory(products);
    }).catch((failure) => {
      if (controller.signal.aborted) return;
      handleAuthError(failure);
      setError(failure);
    });
    return () => controller.abort();
  }, [token, revision, handleAuthError]);

  async function save(values) {
    const editing = editor.product;
    const product = editing ? await updateProduct(editing.id, values, token) : await createProduct(values, token);
    setInventory((current) => editing
      ? current.map((row) => row.id === product.id ? product : row)
      : [product, ...current]);
    setEditor(null);
    notify(editing ? 'Product updated.' : 'Product added.');
  }

  async function remove() {
    try {
      await deleteProduct(deleting.id, token);
      setInventory((current) => current.filter((product) => product.id !== deleting.id));
      setDeleting(null);
      notify('Product deleted.');
    } catch (failure) {
      handleAuthError(failure);
      notify(failure.message, 'error');
      throw failure;
    }
  }

  return (
    <>
      <header className="admin-heading">
        <div><h1>Product inventory</h1><p>Manage the products shown in your storefront.</p></div>
        <button type="button" className="button button--primary" disabled={!inventory}
          onClick={() => setEditor({ product: null })}><Plus size={20} /> Add Product</button>
      </header>
      {error ? <StatusMessage title="Could not load inventory" message={error.message} error action={() => {
        setError(null);
        setRevision((current) => current + 1);
      }} /> : inventory ? (
        <>
          <InventorySummary products={inventory} />
          <section className="inventory-panel" aria-labelledby="inventory-title">
            <div className="inventory-panel-heading"><h2 id="inventory-title">Products</h2><p>{inventory.length} in inventory</p></div>
            {inventory.length > 0
              ? <ProductTable products={inventory} onEdit={(product) => setEditor({ product })} onDelete={setDeleting} />
              : <StatusMessage title="No products yet" message="Add your first product to start building the catalog." />}
          </section>
        </>
      ) : <div className="inventory-loading" role="status" aria-label="Loading inventory">
        <div className="skeleton inventory-loading-cards" /><div className="skeleton inventory-loading-table" />
      </div>}
      {editor && <ProductFormModal product={editor.product} onSave={save} onClose={() => setEditor(null)} />}
      {deleting && <DeleteProductDialog product={deleting} onConfirm={remove} onClose={() => setDeleting(null)} />}
    </>
  );
}
