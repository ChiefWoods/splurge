import { getRelativeTime, truncateAddress } from '@/lib/utils';
import { Star } from 'lucide-react';
import Image from 'next/image';

export function ReviewRow({
  shopperPda,
  shopperName,
  shopperImage,
  timestamp,
  rating,
  text,
}: {
  shopperPda: string;
  shopperName: string;
  shopperImage: string;
  timestamp: number;
  rating: number;
  text: string;
}) {
  return (
    <li className="flex flex-col gap-y-4">
      <div className="flex w-full justify-between gap-y-2">
        <div className="flex items-center justify-start gap-x-2">
          <Image
            src={shopperImage}
            alt={shopperName}
            width={40}
            height={40}
            className="aspect-square rounded-full border"
          />
          <h3 className="text-xl">{shopperName}</h3>
          <p className="text-muted text-sm">{truncateAddress(shopperPda)}</p>
        </div>
        <div className="flex items-center justify-end gap-x-3">
          <div className="flex items-center gap-x-1">
            {[...Array(rating)].map((_, i) => (
              <Star key={i} className="text-rating" size={12} />
            ))}
          </div>
          <p className="text-muted text-xs">{getRelativeTime(timestamp)}</p>
        </div>
      </div>
      <p>{text}</p>
    </li>
  );
}
