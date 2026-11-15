import { useEffect, useId, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { ProductImage } from '../ui/ProductImage';

export function ProductImageField({ url, onUrlChange, file, onFileChange, error, disabled }) {
  const id = useId();
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!file) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setPreview({ file, objectUrl });
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return (
    <div className="image-field form-span">
      <ProductImage src={file ? (preview?.file === file ? preview.objectUrl : '') : url} alt="Product image preview" lazy={false} />
      <div className="image-field-controls">
        <label htmlFor={id}>Image URL</label>
        <input id={id} name="imageUrl" type="url" value={url} onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://…" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <label className="file-button button button--secondary">
          <ImagePlus size={16} /> {file ? 'Change image' : 'Choose image'}
          <input type="file" className="sr-only" aria-label="Choose image" accept="image/jpeg,image/png,image/webp"
            disabled={disabled} onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) onFileChange(selected);
              event.target.value = '';
            }} />
        </label>
        {file && <div className="selected-file">
          <span>{file.name}</span><button type="button" className="text-button" onClick={() => onFileChange(null)}>Clear</button>
        </div>}
        <span className="field-hint">JPG, PNG, or WebP, up to 5 MB.</span>
        {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
      </div>
    </div>
  );
}
