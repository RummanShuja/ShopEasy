import { ArrowDownUp, ChevronDown, SlidersHorizontal, X } from 'lucide-react';

export function ProductFilters({ params, onChange, onClear }) {
  const anyFilters = ['search', 'category', 'minPrice', 'maxPrice', 'sort'].some((key) => params.has(key));
  const setField = (event) => onChange(event.target.name, event.target.value);

  return (
    <div className="filter-bar">
      <div className="price-filters">
        <span className="filter-label"><SlidersHorizontal size={16} /> Price</span>
        <label className="money-input"><span aria-hidden="true">₹</span>
          <input type="number" name="minPrice" aria-label="Minimum price" min="0" step="0.01" placeholder="Min"
            value={params.get('minPrice') || ''} onChange={setField} />
        </label>
        <span className="price-separator" aria-hidden="true">–</span>
        <label className="money-input"><span aria-hidden="true">₹</span>
          <input type="number" name="maxPrice" aria-label="Maximum price" min="0" step="0.01" placeholder="Max"
            value={params.get('maxPrice') || ''} onChange={setField} />
        </label>
      </div>
      <div className="filter-sort">
        {anyFilters && <button type="button" className="clear-filters" onClick={onClear}><X size={15} /> Clear filters</button>}
        <label className="select-wrap sort-control">
          <ArrowDownUp size={16} aria-hidden="true" />
          <span className="sr-only">Sort products</span>
          <select name="sort" value={params.get('sort') || 'newest'} onChange={setField}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price low to high</option>
            <option value="price_desc">Price high to low</option>
            <option value="rating">Highest rated</option>
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </label>
      </div>
    </div>
  );
}
