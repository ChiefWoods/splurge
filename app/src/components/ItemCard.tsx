'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function ItemCard({
  itemPda,
  itemName,
  itemImage,
  storeName,
  storePda,
  children,
}: {
  itemPda: string;
  itemName: string;
  itemImage: string;
  storeName?: string;
  storePda: string;
  children: ReactNode;
}) {
  return (
    <Card className="box-content flex h-fit w-[200px] flex-col items-center gap-y-2 p-4">
      <CardHeader className="flex w-full flex-col gap-y-2 p-0">
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
        {children}
      </CardContent>
    </Card>
  );
}
