'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { EditItemDialog } from './formDialogs/EditItemDialog';
import { DeleteItemDialog } from './formDialogs/DeleteItemDialog';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function StoreItemCard({
  pda,
  name,
  image,
  description,
  inventoryCount,
  price,
  isOwner = false,
}: {
  pda: string;
  name: string;
  image: string;
  description: string;
  inventoryCount: number;
  price: number;
  isOwner?: boolean;
}) {
  const pathname = usePathname();

  return (
    <Link href={`${pathname}/items/${pda}`}>
      <Card className="box-content flex w-[200px] flex-col gap-y-2 p-4">
        <CardHeader className="flex flex-col gap-y-2 p-0">
          <Image
            src={image}
            className="aspect-square rounded-lg border"
            width={200}
            height={200}
            alt={name}
          />
          <CardTitle className="truncate">{name}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-x-4 p-0">
          <div className="flex w-full flex-col gap-y-1">
            <p className="truncate text-muted-foreground">{price} USD</p>
            <p className="truncate text-muted-foreground">
              Inventory - {inventoryCount}
            </p>
          </div>
          {isOwner && (
            <div className="flex gap-x-3">
              <EditItemDialog
                pda={pda}
                name={name}
                image={image}
                description={description}
                inventoryCount={inventoryCount}
                price={price}
              />
              <DeleteItemDialog pda={pda} name={name} />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
