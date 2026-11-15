import { Star } from 'lucide-react';

export function RatingStars({ rating }) {
  return (
    <span className="rating" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <span className="rating-icons" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => (
          <span className="rating-star" key={star}>
            <Star size={13} />
            <span className="rating-fill" style={{ width: `${Math.min(1, Math.max(0, rating - star + 1)) * 100}%` }}>
              <Star size={13} fill="currentColor" />
            </span>
          </span>
        ))}
      </span>
      <span aria-hidden="true">{rating.toFixed(1)}</span>
    </span>
  );
}
