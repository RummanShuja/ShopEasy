import { ChevronDown } from 'lucide-react';
import { useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { HeroBanner } from '../components/store/HeroBanner';
import { CategoryChips } from '../components/store/CategoryChips';
import { ProductFilters, ProductSort } from '../components/store/ProductFilters';
import { ProductGrid } from '../components/store/ProductGrid';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useProducts } from '../hooks/useProducts';
import { productQuery, withFilter } from '../utils/catalogQuery';

export function StorefrontPage() {
  const { categories, categoryError, retryCategories } = useOutletContext();
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const navigate = useNavigate();
  const query = productQuery(params);
  const category = params.get('category') || '';

  const setFilters = (search) => navigate({ search, hash }, { replace: true, preventScrollReset: true });
  const clear = () => setFilters('');
  const change = (field, value) => setFilters(withFilter(params, field, value).toString());

  function selectCategory(value) {
    change('category', value);
    document.getElementById('products')?.scrollIntoView();
  }

  return (
    <div className="container storefront">
      <HeroBanner />
      <section className="categories-section" aria-labelledby="categories-heading">
        <h2 id="categories-heading">Shop by category</h2>
        <CategoryChips categories={categories} selected={category} onChange={selectCategory} />
        {categoryError && <p className="inline-error">Categories could not load. <button type="button" className="text-button" onClick={retryCategories}>Retry</button></p>}
      </section>
      <section className="catalog-section" id="products" aria-labelledby="products-heading">
        <div className="catalog-heading section-heading">
          <h2 id="products-heading">{category || 'Shop products'}</h2>
          <ProductSort value={params.get('sort')} onChange={(value) => change('sort', value === 'newest' ? '' : value)} />
        </div>
        <div className="catalog-layout">
          <ProductFilters params={params} onChange={change} onClear={clear} />
          <div className="catalog-results">
            <CatalogResults key={query} query={query} onClear={clear} />
          </div>
        </div>
      </section>
    </div>
  );
}

function CatalogResults({ query, onClear }) {
  const { products, total, hasNext, error, loading, retry, loadMore } = useProducts(query);
  if (!products.length && error) {
    const fieldError = Object.values(error.fieldErrors || {})[0];
    return <StatusMessage title="Could not load products" message={fieldError || error.message} error
      action={fieldError ? onClear : retry} actionLabel={fieldError ? 'Clear filters' : 'Try again'} />;
  }

  return (
    <>
      <p className="catalog-count" aria-live="polite">
        {products.length > 0 || !loading ? `Showing ${products.length} of ${total} products` : ''}
      </p>
      {!loading && !products.length
        ? <StatusMessage title="No products found" message="Try a different search or clear your filters."
            action={onClear} actionLabel="Clear filters" />
        : <ProductGrid products={products} loading={loading && !products.length} />}
      {(hasNext || error) && (
        <div className="catalog-more">
          {error && <p className="inline-error" role="alert">Could not load more products. {error.message}</p>}
          <button className="button button--secondary" type="button" disabled={loading}
            onClick={error ? retry : loadMore}>
            {loading ? 'Loading more…' : error ? 'Try again' : 'Load More'} <ChevronDown size={17} />
          </button>
        </div>
      )}
    </>
  );
}
