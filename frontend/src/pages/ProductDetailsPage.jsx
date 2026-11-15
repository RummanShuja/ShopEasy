import { useEffect, useState } from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getProduct } from '../api/productsApi';
import { PriceDisplay } from '../components/store/PriceDisplay';
import { RatingStars } from '../components/store/RatingStars';
import { StockStatus } from '../components/store/StockStatus';
import { ProductImage } from '../components/ui/ProductImage';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useCart } from '../context/CartContext';

export function ProductDetailsPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const { add } = useCart();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const key = `${id}:${revision}`;

  useEffect(() => {
    const controller = new AbortController();
    getProduct(id, controller.signal).then((product) => {
      if (!controller.signal.aborted) setResult({ key, product });
    }).catch((error) => {
      if (!controller.signal.aborted) setResult({ key, error });
    });
    return () => controller.abort();
  }, [id, key]);

  const loading = result?.key !== key;
  const product = result?.product;
  const error = result?.error;
  return (
    <div className="container product-details">
      <Link className="back-link" to={{ pathname: '/', search: state?.fromSearch || '', hash: '#products' }}>
        <ArrowLeft size={17} /> Back to products
      </Link>
      {loading ? (
        <div className="details-card" role="status" aria-label="Loading product">
          <div className="skeleton details-skeleton" />
          <div className="details-content" aria-hidden="true"><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line medium" /><div className="skeleton skeleton-button" /></div>
        </div>
      ) : error ? (
        <StatusMessage title={error.status === 404 ? 'Product not found' : 'Could not load this product'}
          message={error.message} error action={error.status !== 404 ? () => setRevision((value) => value + 1) : undefined} />
      ) : (
        <article className="details-card">
          <ProductImage src={product.imageUrl} alt={product.name} lazy={false} />
          <div className="details-content">
            <span className="details-category">{product.category}</span>
            <h1>{product.name}</h1>
            <p className="product-brand">{product.brand}</p>
            <RatingStars rating={product.rating} />
            <PriceDisplay product={product} showBadge />
            <StockStatus stock={product.stock} includeCount />
            <p className="details-description">{product.description}</p>
            <button type="button" className="button button--primary" disabled={product.stock === 0} onClick={() => add(product)}>
              <ShoppingBag size={18} /> Add to Cart
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
