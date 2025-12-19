'use client';

import { useMobile } from '@/hooks/useMobile';
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
  const { isMobile } = useMobile();

  return (
    <li className="flex flex-col gap-y-4">
      <div className="flex w-full justify-between gap-2">
        <div className="flex items-center justify-start gap-x-2">
          <Image
            src={shopperImage}
            alt={shopperName}
            width={isMobile ? 24 : 40}
            height={isMobile ? 24 : 40}
            className="aspect-square rounded-full border"
          />
          <div className="flex flex-wrap items-center gap-x-2">
            <h3 className="text-base md:text-xl">{shopperName}</h3>
            <p className="text-muted text-xs md:text-sm">
              {truncateAddress(shopperPda)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-3">
          <div className="flex items-center gap-x-1">
            {[...Array(rating)].map((_, i) => (
              <Star key={i} className="text-rating" size={12} />
            ))}
          </div>
          <p className="text-muted text-xs">{getRelativeTime(timestamp)}</p>
        </div>
      </div>
      <p className="text-sm md:text-base">{text}</p>
    </li>
  );
}
