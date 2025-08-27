'use client';

import { InfoTooltip } from '@/components/InfoTooltip';
import { MintIcon } from '@/components/MintIcon';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { atomicToUsd } from '@/lib/utils';
import { usePyth } from '@/providers/PythProvider';
import { useStore } from '@/providers/StoreProvider';
import { useEffect, useState } from 'react';

interface RowBalance {
  name: string;
  image: string;
  balance: string;
}

export default function Page() {
  const { storeTokenAccounts } = useStore();
  const { prices } = usePyth();
  const [balanceRows, setBalanceRows] = useState<RowBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);

  useEffect(() => {
    if (storeTokenAccounts.data) {
      let totalBalance = 0;

      setBalanceRows(
        storeTokenAccounts.data.map(({ amount, mint }) => {
          const metadata = ACCEPTED_MINTS_METADATA.get(mint);

          if (!metadata) {
            throw new Error(`Metadata not found for mint: ${mint}`);
          }

          const mintPrice = prices.data?.find((p) => {
            return p.mint === mint;
          });

          if (!mintPrice) {
            throw new Error(`Price not found for mint: ${mint}`);
          }

          const balance = atomicToUsd(amount * mintPrice.price);
          totalBalance += Number(balance);

          return {
            name: metadata.name,
            image: metadata.image,
            balance,
          };
        })
      );

      setTotalBalance(totalBalance);
    }
  }, [storeTokenAccounts, prices]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">Your Earnings</h2>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-full">Token</TableHead>
            <TableHead className="flex items-center gap-2">
              Balance
              <InfoTooltip text="Oracle-priced" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {storeTokenAccounts.isLoading || prices.isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : (
            Boolean(balanceRows.length) && (
              <>
                {balanceRows.map(({ name, image, balance }) => (
                  <TableRow key={name}>
                    <TableCell className="flex items-center gap-2">
                      <MintIcon src={image} alt={name} />
                      {name}
                    </TableCell>
                    <TableCell>${balance}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="font-semibold">
                    ${totalBalance.toFixed(2)}
                  </TableCell>
                </TableRow>
              </>
            )
          )}
        </TableBody>
      </Table>
    </section>
  );
}
