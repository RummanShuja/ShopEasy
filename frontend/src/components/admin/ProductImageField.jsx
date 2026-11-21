import { useEffect, useId, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { ProductImage } from '../ui/ProductImage';

function imageFilename(url) {
  if (!url) return 'No image selected';
  try {
    const filename = new URL(url).pathname.split('/').filter(Boolean).at(-1);
    return filename ? decodeURIComponent(filename) : 'Current product image';
  } catch { return 'Product image'; }
}

export function ProductImageField({ url, onUrlChange, file, onFileChange, error, disabled }) {
  const id = useId();
  const [preview, setPreview] = useState(null);
  const [useLink, setUseLink] = useState(false);
  const [replacementLink, setReplacementLink] = useState('');
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
        <span className="image-field-label">Product image</span>
        <span className="image-filename" aria-live="polite">{file?.name || imageFilename(url)}</span>
        <label className="file-button button button--secondary">
          <ImagePlus size={16} /> {file || url ? 'Replace image' : 'Choose image'}
          <input type="file" name="imageFile" className="sr-only" aria-label="Choose image" accept="image/jpeg,image/png,image/webp"
            aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
            disabled={disabled} onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) { onFileChange(selected); setUseLink(false); setReplacementLink(''); }
              event.target.value = '';
            }} />
        </label>
        {file && <div className="selected-file">
          <span>Ready to upload</span><button type="button" className="text-button" disabled={disabled} onClick={() => onFileChange(null)}>Clear selection</button>
        </div>}
        <span className="field-hint">JPG, PNG, or WebP, up to 5 MB.</span>
        <button type="button" className="text-button image-link-toggle" disabled={disabled} aria-expanded={useLink}
          aria-controls={`${id}-link`} onClick={() => setUseLink(!useLink)}>{useLink ? 'Hide image link field' : 'Use an image link instead'}</button>
        {useLink && <div className="image-link-fields" id={`${id}-link`}>
          <label htmlFor={id}>New image link</label>
          <input id={id} name="imageUrl" type="url" value={replacementLink} disabled={disabled}
            onChange={(event) => { setReplacementLink(event.target.value); onFileChange(null); onUrlChange(event.target.value); }}
            placeholder="Paste a replacement image link" aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        </div>}
        {error && <span className="field-error" id={`${id}-error`}>{error}</span>}
      </div>
    </div>
  );
}
