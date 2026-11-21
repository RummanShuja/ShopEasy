import { ArrowUpRight } from 'lucide-react';

const CATEGORIES = {
  Vitamins: { image: 'vitamin-d3', description: 'Daily health & wellbeing', label: 'Vitamins & supplements' },
  'Personal Care': { image: 'hand-wash', description: 'Little rituals, everyday care' },
  'Skin Care': { image: 'moisturizer', description: 'Feel good in your skin' },
  'First Aid': { image: 'gauze-roll', description: 'Prepared for the everyday' },
  'Health Devices': { image: 'blood-pressure', description: 'A closer look at your health' },
};
export function CategoryChips({ categories, selected, onChange }) {
  return <div className="category-chips" role="group" aria-label="Product categories">
    {categories.map((category) => {
      const details = CATEGORIES[category] || { image: 'multivitamin', description: 'Explore everyday essentials' };
      return <button key={category} className="category-chip" aria-pressed={selected === category} onClick={() => onChange(category)}>
        <div><h3>{details.label || category}</h3><p>{details.description}</p></div>
        <img src={`/categories/${details.image}.webp`} alt="" loading="lazy" /><span className="category-arrow"><ArrowUpRight size={19} /></span>
      </button>;
    })}
  </div>;
}
