import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  className?: string;
  starClassName?: string;
}

export function StarRating({ rating, totalStars = 5, className, starClassName }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1 > 0;
  const emptyStars = totalStars - fullStars - (partialStar ? 1 : 0);

  return (
    <div className={cn('flex items-center', className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className={cn('h-4 w-4 text-yellow-400 fill-current', starClassName)} />
      ))}
      {partialStar && (
        <div className="relative">
            <Star key="partial" className={cn('h-4 w-4 text-yellow-400', starClassName)} />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${(rating % 1) * 100}%` }}>
                <Star className={cn('h-4 w-4 text-yellow-400 fill-current', starClassName)} />
            </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className={cn('h-4 w-4 text-gray-300', starClassName)} />
      ))}
    </div>
  );
}
