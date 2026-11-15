import { ArrowDownUp, ChevronDown, SlidersHorizontal, X } from 'lucide-react';

export function ProductFilters({ params, onChange, onClear }) {
  const anyFilters = ['search', 'category', 'minPrice', 'maxPrice', 'sort'].some((key) => params.has(key));
  const setField = (event) => onChange(event.target.name, event.target.value);

  return (
    <aside className="catalog-filters" aria-labelledby="filters-heading">
      <h3 id="filters-heading"><SlidersHorizontal size={17} aria-hidden="true" /> Filters</h3>
      <fieldset className="price-filters">
        <legend>Price range</legend>
        <div className="price-fields">
          <label>Min
            <span className="money-input"><span aria-hidden="true">₹</span>
              <input type="number" name="minPrice" aria-label="Minimum price" min="0" step="0.01" placeholder="Any"
                value={params.get('minPrice') || ''} onChange={setField} />
            </span>
          </label>
          <label>Max
            <span className="money-input"><span aria-hidden="true">₹</span>
              <input type="number" name="maxPrice" aria-label="Maximum price" min="0" step="0.01" placeholder="Any"
                value={params.get('maxPrice') || ''} onChange={setField} />
            </span>
          </label>
        </div>
      </fieldset>
      {anyFilters && <button type="button" className="clear-filters" onClick={onClear}>
        <X size={15} aria-hidden="true" /> Clear filters
      </button>}
    </aside>
  );
}

export function ProductSort({ value, onChange }) {
  return (
    <label className="select-wrap sort-control">
      <ArrowDownUp size={16} aria-hidden="true" />
      <span className="sr-only">Sort products</span>
      <select name="sort" value={value || 'newest'} onChange={(event) => onChange(event.target.value)}>
        <option value="newest">Newest</option>
        <option value="price_asc">Price low to high</option>
        <option value="price_desc">Price high to low</option>
        <option value="rating">Highest rated</option>
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  );
}
