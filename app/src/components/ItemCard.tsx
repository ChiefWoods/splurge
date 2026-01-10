'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { LargeImage } from './LargeImage';
import { ParsedItem, ParsedStore } from '@/types/accounts';

export function ItemCard({
  item,
  store,
  children,
}: {
  item: ParsedItem;
  store: ParsedStore;
  children: ReactNode;
}) {
  return (
    <Card className="bg-secondary/50 box-content flex h-fit w-fit flex-col items-center gap-y-1 border-none p-4 md:w-[200px] md:gap-y-2">
      <CardHeader className="flex w-full flex-col gap-y-1 p-0 md:gap-y-2">
        <Link href={`/stores/${store.publicKey}/items/${item.publicKey}`}>
          <LargeImage src={item.image} alt={item.name} />
        </Link>
        <CardTitle className="truncate text-base md:text-xl">
          {item.name}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'flex w-full gap-x-2 gap-y-2 p-0 md:gap-x-4 md:gap-y-2',
          store.name ? 'flex-col' : 'flex-col items-end md:flex-row'
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
