import { getRelativeTime, truncateAddress } from '@/lib/utils';
import { ParsedReview, ParsedShopper } from '@/types/accounts';
import { Star } from 'lucide-react';
import Image from 'next/image';

export function ReviewRow({
  review,
  shopper,
}: {
  review: ParsedReview;
  shopper: ParsedShopper;
}) {
  return (
    <li className="flex flex-col gap-y-4">
      <div className="flex w-full justify-between gap-2">
        <div className="flex items-center justify-start gap-x-2">
          <Image
            src={shopper.image}
            alt={shopper.name}
            width={0}
            height={0}
            className="aspect-square size-6 rounded-full border md:size-10"
          />
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="text-base md:text-xl">{shopper.name}</h3>
            <p className="text-muted text-xs md:text-sm">
              {truncateAddress(shopper.publicKey)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-3">
          <div className="flex items-center gap-x-1">
            {[...Array(review.rating)].map((_, i) => (
              <Star key={i} className="text-rating" size={12} />
            ))}
          </div>
          <p className="text-muted text-xs">
            {getRelativeTime(review.timestamp)}
          </p>
        </div>
      </div>
      <p className="text-sm md:text-base">{review.text}</p>
    </li>
  );
}
