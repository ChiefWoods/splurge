import { ReactNode } from 'react';
import { TableCell, TableRow } from './ui/table';
import Image from 'next/image';
import { atomicToUsd } from '@/lib/utils';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { TimestampTooltip } from './TimestampTooltip';
import { Button } from './ui/button';
import Link from 'next/link';
import { getAccountLink } from '@/lib/solana-helpers';
import { SquareArrowOutUpRight } from 'lucide-react';

export function OrderTableRow({
  orderPda,
  itemImage,
  itemName,
  amount,
  paymentSubtotal,
  platformFee,
  paymentMint,
  timestamp,
  firstCell,
}: {
  orderPda: string;
  itemImage: string;
  itemName: string;
  amount: number;
  paymentSubtotal: number;
  platformFee: number;
  paymentMint: string;
  timestamp: number;
  firstCell: ReactNode;
}) {
  const metadata = ACCEPTED_MINTS_METADATA.get(paymentMint);

  if (!metadata) {
    throw new Error(`Metadata not found for mint: ${paymentMint}`);
  }

  return (
    <TableRow>
      <TableCell>{firstCell}</TableCell>
      <TableCell>
        <div className="flex items-center gap-x-4">
          <div className="h-12 w-12 rounded-lg border bg-[#f4f4f5] p-1">
            <Image
              src={itemImage}
              alt={itemName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-md">{itemName}</span>
        </div>
      </TableCell>
      <TableCell>{amount}</TableCell>
      <TableCell>
        <div className="flex items-center gap-x-2">
          <span>{atomicToUsd(paymentSubtotal + platformFee)}</span>
          <Image
            src={metadata.image}
            alt={metadata.name}
            width={20}
            height={20}
          />
        </div>
      </TableCell>
      <TableCell>
        <TimestampTooltip timestamp={timestamp} />
      </TableCell>
      <TableCell>
        <Button
          asChild
          size={'icon'}
          type="button"
          variant={'ghost'}
          className="h-fit w-fit"
        >
          <Link href={getAccountLink(orderPda)} target="_blank">
            <SquareArrowOutUpRight />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
