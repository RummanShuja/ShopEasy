import { useState } from 'react';
import { ArrowRight, ChevronDown, HeartHandshake, Leaf, PackageCheck, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { Link, useLocation, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { HeroBanner } from '../components/store/HeroBanner';
import { CategoryChips } from '../components/store/CategoryChips';
import { ProductFilters, ProductSort } from '../components/store/ProductFilters';
import { ProductGrid } from '../components/store/ProductGrid';
import { Dialog } from '../components/ui/Dialog';
import { StatusMessage } from '../components/ui/StatusMessage';
import { useProducts } from '../hooks/useProducts';
import { productQuery, withFilter } from '../utils/catalogQuery';

export function StorefrontPage() {
  const { categories, categoryError, retryCategories } = useOutletContext();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const shop = pathname === '/shop' || Boolean(params.toString());
  const category = params.get('category') || '';
  const offers = params.get('offersOnly') === 'true';
  const change = (field, value) => navigate({ pathname: '/shop', search: withFilter(params, field, value).toString(), hash: '#products' }, { replace: true, preventScrollReset: true });
  const clear = () => navigate('/shop#products', { replace: true, preventScrollReset: true });
  return <div className={`storefront${shop ? ' shop-page' : ' home-page'}`}>
    <HeroBanner shop={shop} offers={offers} />
    {!shop && <><div className="trust-strip container">{[
      [PackageCheck, 'Care, made convenient', 'Essentials in one place'], [ShieldCheck, 'Shop with confidence', 'Clear prices & product details'],
      [HeartHandshake, 'Thoughtful everyday care', 'For you and your home'], [Leaf, 'Your wellbeing, first', 'Small rituals. Lasting care.'],
    ].map(([Icon, title, description]) => <div key={title}><Icon size={29} strokeWidth={1.3} /><div><strong>{title}</strong><span>{description}</span></div></div>)}</div>
      <section className="container categories-section" aria-labelledby="categories-heading"><div className="section-heading"><div><span className="eyebrow">A little care for every need</span><h2 id="categories-heading">Shop by wellness need.</h2></div><Link to="/shop">View all essentials <ArrowRight size={18} /></Link></div>
        <CategoryChips categories={categories} selected={category} onChange={(name) => navigate(`/shop?category=${encodeURIComponent(name)}#products`)} />
        {categoryError && <p className="inline-error">Categories could not load. <button className="text-button" onClick={retryCategories}>Retry</button></p>}
      </section></>}
    <section className="container catalog-section" id="products" aria-labelledby="products-heading">
      {!shop && <div className="section-heading"><div><span className="eyebrow">Everyday essentials, thoughtfully chosen</span><h2 id="products-heading">Good care starts here.</h2></div><Link to="/shop">Explore the collection <ArrowRight size={18} /></Link></div>}
      {shop && <h2 className="sr-only" id="products-heading">{offers ? `${category || 'Everyday essentials'} on offer` : category || 'All products'}</h2>}
      <div className={shop ? 'catalog-layout' : 'home-catalog'}>
        {shop && <ProductFilters params={params} categories={categories} onChange={change} onClear={clear} />}
        <div className="catalog-results"><CatalogResults key={productQuery(params)} query={productQuery(params)} onClear={clear} shop={shop}
          toolbar={<><button className="button filter-drawer-toggle" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} />Filters</button>
            <ProductSort value={params.get('sort')} onChange={(value) => change('sort', value)} /></>} />
          {shop && <div className="collection-banner"><div><span className="eyebrow">Your daily dose of wellbeing</span><h3>Small rituals.<br />A little more you.</h3></div><Link to="/shop?category=Skin%20Care#products" className="button button--primary">Explore skin care <ArrowRight size={17} /></Link></div>}
        </div>
      </div>
    </section>
    {!shop && <section className="container care-editorial"><div><span className="eyebrow">The ShopEasy philosophy</span><h2>Feeling well starts<br />with the everyday.</h2></div><div><p>From your morning vitamins to the care you keep close, we believe looking after yourself should feel simple.</p><Link to="/shop" className="back-link">Find your everyday essentials <ArrowRight size={18} /></Link></div><Leaf size={120} strokeWidth={.6} /></section>}
    {filtersOpen && <Dialog title="Find your essentials" className="filter-drawer" onClose={() => setFiltersOpen(false)}>
      <div className="filter-drawer-content"><ProductFilters mobile params={params} categories={categories} onChange={change} onClear={clear} /></div>
      <div className="dialog-actions"><button className="button button--primary" onClick={() => setFiltersOpen(false)}>Show results <ArrowRight size={16} /></button></div>
    </Dialog>}
  </div>;
}
function CatalogResults({ query, onClear, shop, toolbar }) {
  const { products, total, hasNext, error, loading, retry, loadMore } = useProducts(query);
  if (!products.length && error) return <StatusMessage title="Your essentials are taking a moment" message={Object.values(error.fieldErrors || {})[0] || error.message} error action={error.fieldErrors && Object.keys(error.fieldErrors).length ? onClear : retry} />;
  return <><div className="catalog-toolbar"><p className="catalog-count" aria-live="polite">{loading && !products.length ? 'Finding your essentials…' : `Showing ${products.length ? '1 – ' : ''}${products.length} of ${total} products`}</p>{shop && toolbar}</div>
    {!loading && !products.length ? <StatusMessage title="No essentials found" message="Try a different search or give your filters a fresh start." action={onClear} actionLabel="Clear filters" />
      : <ProductGrid products={products} loading={loading && !products.length} />}
    {(hasNext || error) && <div className="catalog-more">{error && <p className="inline-error" role="alert">{error.message}</p>}
      <button className="button button--secondary" disabled={loading} onClick={error ? retry : loadMore}>{loading ? 'Loading…' : error ? 'Try again' : 'Discover more'} <ChevronDown size={16} /></button></div>}
  </>;
}
