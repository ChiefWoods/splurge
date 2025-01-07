'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { UpdateItemDialog } from './formDialogs/UpdateItemDialog';
import { DeleteItemDialog } from './formDialogs/DeleteItemDialog';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function StoreItemCard({
  pda,
  name,
  image,
  description,
  inventoryCount,
  price,
  isOwner = false,
  mutate,
}: {
  pda: string;
  name: string;
  image: string;
  description: string;
  inventoryCount: number;
  price: number;
  isOwner?: boolean;
  mutate: () => void;
}) {
  const pathname = usePathname();

  return (
    <Card className="box-content flex w-[200px] flex-col items-center gap-y-2 p-4">
      <CardHeader className="flex flex-col gap-y-2 p-0">
        <Link href={`${pathname}/items/${pda}`}>
          <Image
            src={image}
            className="aspect-square rounded-lg border"
            width={200}
            height={200}
            alt={name}
          />
        </Link>
        <CardTitle className="truncate">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex w-full items-end gap-x-4 p-0">
        <div className="flex w-full flex-col gap-y-1 overflow-hidden">
          <p className="muted-text">{price.toFixed(2)} USD</p>
          <p className="muted-text">{inventoryCount} left</p>
        </div>
        {isOwner && (
          <div className="flex gap-x-2">
            <UpdateItemDialog
              name={name}
              image={image}
              description={description}
              inventoryCount={inventoryCount}
              price={price}
              mutate={mutate}
            />
            <DeleteItemDialog name={name} mutate={mutate} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
