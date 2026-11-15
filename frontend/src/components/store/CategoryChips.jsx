import { Bandage, Droplets, HeartPulse, LayoutGrid, Pill, Sparkles } from 'lucide-react';

const ICONS = { Vitamins: Pill, 'First Aid': Bandage, 'Personal Care': Droplets,
  'Skin Care': Sparkles, 'Health Devices': HeartPulse };

export function CategoryChips({ categories, selected, onChange }) {
  return (
    <div className="category-chips" aria-label="Product categories">
      {['', ...categories].map((category) => {
        const Icon = ICONS[category] || LayoutGrid;
        return (
          <button key={category} type="button" className="category-chip" aria-pressed={selected === category}
            onClick={() => onChange(category)}>
            <Icon size={20} aria-hidden="true" /><span>{category || 'All products'}</span>
          </button>
        );
      })}
    </div>
  );
}
