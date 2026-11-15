import { useId, useState } from 'react';
import { uploadImage } from '../../api/adminApi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useToast } from '../../context/ToastContext';
import { Dialog } from '../ui/Dialog';
import { ProductImageField } from './ProductImageField';

const EMPTY = {
  name: '', brand: '', description: '', category: '', price: '',
  discountPercent: '0', stock: '0', rating: '0', imageUrl: '', active: true,
};

const FIELDS = [
  { name: 'name', label: 'Product name', maxLength: 100 },
  { name: 'brand', label: 'Brand' },
  { name: 'category', label: 'Category', placeholder: 'e.g. First Aid' },
  { name: 'price', label: 'Original price (₹)', type: 'number', min: '0.01', step: '0.01' },
  { name: 'discountPercent', label: 'Discount (%)', type: 'number', min: '0', max: '90', step: '1' },
  { name: 'stock', label: 'Stock quantity', type: 'number', min: '0', step: '1' },
  { name: 'rating', label: 'Rating (0–5)', type: 'number', min: '0', max: '5', step: '0.1' },
];

function formFor(product) {
  if (!product) return EMPTY;
  return Object.fromEntries(Object.keys(EMPTY).map((key) => [key, key === 'active' ? product.active : String(product[key])]));
}

function validate(form, file) {
  const errors = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 100) errors.name = 'Enter 2 to 100 characters.';
  if (!form.brand.trim()) errors.brand = 'Enter a brand.';
  if (!form.category.trim()) errors.category = 'Enter a category.';
  if (!form.description.trim() || form.description.trim().length > 500) errors.description = 'Enter a description of up to 500 characters.';
  const numberWithin = (value, min, max, whole = false) => value !== '' && Number.isFinite(Number(value))
    && Number(value) >= min && Number(value) <= max && (!whole || Number.isInteger(Number(value)));
  if (!numberWithin(form.price, Number.MIN_VALUE, Number.MAX_VALUE)) errors.price = 'Enter a price greater than zero.';
  if (!numberWithin(form.discountPercent, 0, 90, true)) errors.discountPercent = 'Enter a whole number from 0 to 90.';
  if (!numberWithin(form.stock, 0, 2147483647, true)) errors.stock = 'Enter a valid non-negative whole number.';
  if (!numberWithin(form.rating, 0, 5)) errors.rating = 'Enter a rating from 0 to 5.';

  if (file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) errors.imageUrl = 'Choose a JPG, PNG, or WebP image.';
    else if (file.size === 0 || file.size > 5 * 1024 * 1024) errors.imageUrl = 'Choose a nonempty image up to 5 MB.';
  } else {
    try {
      const url = new URL(form.imageUrl.trim());
      if (!/^https?:\/\//i.test(form.imageUrl.trim()) || !url.hostname) throw new Error();
    } catch {
      errors.imageUrl = 'Enter an HTTP or HTTPS image URL, or choose a file.';
    }
  }
  return errors;
}

export function ProductFormModal({ product, onSave, onClose }) {
  const [form, setForm] = useState(() => formFor(product));
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const id = useId();
  const { token, handleAuthError } = useAdminAuth();
  const notify = useToast();

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  }

  function selectFile(value) {
    setFile(value);
    setErrors((current) => ({ ...current, imageUrl: undefined }));
    setSubmitError('');
  }

  async function submit(event) {
    event.preventDefault();
    const validation = validate(form, file);
    setErrors(validation);
    setSubmitError('');
    if (Object.keys(validation).length) {
      const field = event.currentTarget.elements.namedItem(Object.keys(validation)[0]);
      field?.focus();
      return;
    }

    setBusy(true);
    try {
      let imageUrl = form.imageUrl.trim();
      if (file) {
        ({ imageUrl } = await uploadImage(file, token));
        setFile(null);
        setForm((current) => ({ ...current, imageUrl }));
      }

      await onSave({
        name: form.name.trim(), brand: form.brand.trim(), description: form.description.trim(),
        category: form.category.trim(), price: Number(form.price), discountPercent: Number(form.discountPercent),
        stock: Number(form.stock), rating: Number(form.rating), active: form.active, imageUrl,
      });
    } catch (error) {
      handleAuthError(error);
      setErrors(error.fieldErrors || {});
      setSubmitError(error.message);
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title={product ? 'Edit product' : 'Add product'} onClose={onClose} busy={busy} className="product-form-dialog">
      <form className="product-form" noValidate onSubmit={submit}>
        <div className="product-form-scroll">
          <fieldset disabled={busy}>
            <div className="form-grid">
              {FIELDS.map(({ name, label, type = 'text', ...attributes }) => (
                <div className="form-field" key={name}>
                  <label htmlFor={`${id}-${name}`}>{label}</label>
                  <input {...attributes} id={`${id}-${name}`} name={name} type={type} value={form[name]}
                    onChange={(event) => change(name, event.target.value)} aria-invalid={Boolean(errors[name])}
                    aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} />
                  {errors[name] && <span className="field-error" id={`${id}-${name}-error`}>{errors[name]}</span>}
                </div>
              ))}
              <label className="active-control">
                <input type="checkbox" checked={form.active} onChange={(event) => change('active', event.target.checked)} />
                <span>Visible in the storefront</span>
              </label>
              <div className="form-field form-span">
                <label htmlFor={`${id}-description`}>Description</label>
                <textarea id={`${id}-description`} name="description" rows="3" maxLength={500} value={form.description}
                  onChange={(event) => change('description', event.target.value)} aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? `${id}-description-error` : undefined} />
                {errors.description && <span className="field-error" id={`${id}-description-error`}>{errors.description}</span>}
              </div>
              <ProductImageField url={form.imageUrl} file={file} onFileChange={selectFile} disabled={busy}
                onUrlChange={(value) => { setFile(null); change('imageUrl', value); }} error={errors.imageUrl} />
            </div>
          </fieldset>
          {submitError && <p className="inline-error form-submit-error" role="alert">{submitError}</p>}
        </div>
        <div className="dialog-actions">
          <button type="button" className="button button--secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="button button--primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </Dialog>
  );
}
