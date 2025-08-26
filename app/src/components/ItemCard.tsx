'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { atomicToUsd, cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function ItemCard({
  itemPda,
  itemName,
  itemImage,
  inventoryCount,
  price,
  storeName,
  storePda,
  children,
}: {
  itemPda: string;
  itemName: string;
  itemImage: string;
  inventoryCount: number;
  price: number;
  storeName?: string;
  storePda: string;
  children: ReactNode;
}) {
  return (
    <Card className="box-content flex h-fit w-[200px] flex-col items-center gap-y-2 p-4">
      <CardHeader className="flex flex-col gap-y-2 p-0">
        <Link href={`/stores/${storePda}/items/${itemPda}`}>
          <Image
            src={itemImage}
            className="aspect-square rounded-lg border"
            width={200}
            height={200}
            alt={itemName}
          />
        </Link>
        <CardTitle className="truncate">{itemName}</CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          'flex w-full gap-x-4 gap-y-2 p-0',
          storeName ? 'flex-col' : 'flex-row items-end'
        )}
      >
        <div className="flex w-full flex-col gap-y-1 overflow-hidden">
          <p className="muted-text">{atomicToUsd(price)} USD</p>
          {!storeName && <p className="muted-text">{inventoryCount} left</p>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
