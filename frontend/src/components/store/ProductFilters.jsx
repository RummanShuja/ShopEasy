import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

export function ProductFilters({ params, categories = [], onChange, onClear, mobile = false }) {
  const any = ['search', 'category', 'minPrice', 'maxPrice', 'minRating', 'inStock', 'offersOnly'].some((key) => params.has(key));
  return <aside className={`catalog-filters${mobile ? ' mobile-filters' : ''}`} aria-label="Product filters">
    <h3><SlidersHorizontal size={19} /> Filters{any && <button className="text-button" onClick={onClear}>Reset</button>}</h3>
    <details className="filter-group" open><summary>Category <ChevronDown size={16} /></summary><div className="filter-options">
      {['', ...categories].map((name) => <label key={name}><input type="radio" name={mobile ? 'mobile-category' : 'category'} checked={(params.get('category') || '') === name}
        onChange={() => onChange('category', name)} />{name || 'All products'}</label>)}
    </div></details>
    <details className="filter-group" open><summary>Price range <ChevronDown size={16} /></summary><p className="filter-help">Original price, before discounts</p>
      <div className="price-fields">{['minPrice', 'maxPrice'].map((name) => <label key={name}>{name === 'minPrice' ? 'From' : 'To'}
        <span className="money-input"><span>₹</span><input type="number" name={name} aria-label={name === 'minPrice' ? 'Minimum price' : 'Maximum price'} min="0" step="1" placeholder={name === 'minPrice' ? '0' : 'Any'}
          value={params.get(name) || ''} onChange={(event) => onChange(name, event.target.value)} /></span></label>)}</div>
    </details>
    <details className="filter-group" open><summary>Rating <ChevronDown size={16} /></summary><div className="filter-options">
      <label><input type="checkbox" checked={params.get('minRating') === '4'} onChange={(event) => onChange('minRating', event.target.checked ? '4' : '')} />4 stars & above <span className="filter-star">★</span></label>
    </div></details>
    <details className="filter-group" open><summary>Availability <ChevronDown size={16} /></summary><div className="filter-options">
      <label><input type="checkbox" checked={params.get('inStock') === 'true'} onChange={(event) => onChange('inStock', event.target.checked ? 'true' : '')} />In stock only</label>
    </div></details>
    <details className="filter-group" open><summary>Offers <ChevronDown size={16} /></summary><div className="filter-options">
      <label><input type="checkbox" checked={params.get('offersOnly') === 'true'} onChange={(event) => onChange('offersOnly', event.target.checked ? 'true' : '')} />Offers only</label>
    </div></details>
    {any && <button className="clear-filters" onClick={onClear}><X size={14} /> Clear all filters</button>}
    <div className="filter-note"><span className="eyebrow">A little guidance</span><p>Choose care that feels right for you.</p><span>Always follow the product label and your healthcare professional’s advice.</span></div>
  </aside>;
}
export function ProductSort({ value, onChange }) {
  return <label className="select-wrap sort-control"><span>Sort by:</span><select name="sort" aria-label="Sort products" value={value || 'newest'} onChange={(event) => onChange(event.target.value)}>
    <option value="newest">Featured</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Highest rated</option>
  </select><ChevronDown size={15} /></label>;
}
