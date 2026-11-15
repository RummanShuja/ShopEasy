import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export function ProductImage({ src, alt, className = '', lazy = true }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return (
    <div className={`product-image ${className}`}>
      {src && failedUrl !== src
        ? <img src={src} alt={alt} loading={lazy ? 'lazy' : 'eager'} referrerPolicy="no-referrer" onError={() => setFailedUrl(src)} />
        : <span className="image-placeholder" role="img" aria-label="Image unavailable"><ImageOff size={25} /></span>}
    </div>
  );
}
