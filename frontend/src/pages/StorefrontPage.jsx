import { useOutletContext, useSearchParams } from 'react-router-dom';
import { HeroBanner } from '../components/store/HeroBanner';
import { CategoryChips } from '../components/store/CategoryChips';
import { ProductFilters } from '../components/store/ProductFilters';
import { ProductGrid } from '../components/store/ProductGrid';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useProducts } from '../hooks/useProducts';
import { productQuery, withFilter } from '../utils/catalogQuery';

export function StorefrontPage() {
  const { categories, categoryError, retryCategories } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const { products, error, loading, retry } = useProducts(productQuery(params));

  const clear = () => setParams({}, { replace: true });
  const change = (field, value) => setParams(withFilter(params, field, value), { replace: true });
  const fieldError = error && Object.values(error.fieldErrors || {})[0];

  return (
    <div className="container storefront">
      <HeroBanner />
      <section className="categories-section" aria-labelledby="categories-heading">
        <h2 id="categories-heading">Shop by category</h2>
        <CategoryChips categories={categories} selected={params.get('category') || ''} onChange={(value) => change('category', value)} />
        {categoryError && <p className="inline-error">Categories could not load. <button type="button" className="text-button" onClick={retryCategories}>Retry</button></p>}
      </section>
      <section className="catalog-section" id="products" aria-labelledby="products-heading">
        <div className="section-heading">
          <h2 id="products-heading">Explore products</h2>
          <p aria-live="polite">{!loading && !error && `${products.length} ${products.length === 1 ? 'product' : 'products'}`}</p>
        </div>
        <ProductFilters params={params} onChange={change} onClear={clear} />
        {error ? <StatusMessage title="Could not load products" message={fieldError || error.message} error
          action={fieldError ? clear : retry} actionLabel={fieldError ? 'Clear filters' : 'Try again'} />
          : !loading && !products.length
            ? <StatusMessage title="No products found" message="Try a different search or clear your filters."
              action={clear} actionLabel="Clear filters" />
            : <ProductGrid products={products} loading={loading} />}
      </section>
    </div>
  );
}
