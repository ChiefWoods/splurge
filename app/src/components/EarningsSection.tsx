'use client';

import { InfoTooltip } from '@/components/InfoTooltip';
import { MintIcon } from '@/components/MintIcon';
import { SectionHeader } from '@/components/SectionHeader';
import { TransactionToast } from '@/components/TransactionToast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { buildTx } from '@/lib/client/solana';
import { atomicToUsd } from '@/lib/utils';
import { useEarnings } from '@/providers/EarningsProvider';
import { useConnection, useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { PublicKey } from '@solana/web3.js';
import { HandCoins } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { sendTx } from '@/lib/api';
import { useSettings } from '@/providers/SettingsProvider';
import { SplurgeClient } from '@/classes/SplurgeClient';
import { SPLURGE_CLIENT } from '@/lib/client/solana';
import { Price } from '@/types/price';

export function EarningsSection({ prices }: { prices: Price[] }) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { earningsData, earningsLoading, earningsMutate } = useEarnings();
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const balanceRows = useMemo(() => {
    if (!earningsData) return [];

    return earningsData.map(({ amount, mint }) => {
      const metadata = ACCEPTED_MINTS_METADATA.get(mint);

      if (!metadata) {
        throw new Error(`Metadata not found for mint: ${mint}`);
      }

      const mintPrice = prices.find((p) => {
        return p.mint === mint;
      });

      if (!mintPrice) {
        throw new Error(`Price not found for mint: ${mint}`);
      }

      const balance = atomicToUsd(amount * mintPrice.price);

      return {
        name: metadata.name,
        image: metadata.image,
        balance,
      };
    });
  }, [earningsData, prices]);

  const totalBalance = balanceRows.reduce(
    (sum, row) => sum + Number(row.balance),
    0
  );

  const onWithdraw = useCallback(() => {
    toast.promise(
      async () => {
        if (!publicKey || !signTransaction) {
          throw new Error('Wallet not connected.');
        }

        if (!earningsData) {
          throw new Error('No store associated token accounts found.');
        }

        setIsWithdrawing(true);

        let tx = await buildTx(
          connection,
          await Promise.all(
            earningsData
              .filter(({ amount }) => amount > 0)
              .map(async ({ mint }) => {
                const metadata = ACCEPTED_MINTS_METADATA.get(mint);

                if (!metadata) {
                  throw new Error(`Metadata not found for mint: ${mint}`);
                }

                return await SPLURGE_CLIENT.withdrawEarningsIx({
                  authority: publicKey,
                  paymentMint: new PublicKey(mint),
                  storePda: SplurgeClient.getStorePda(publicKey),
                  tokenProgram: metadata.owner,
                });
              })
          ),
          publicKey,
          [],
          priorityFee
        );

        tx = await signTransaction(tx);
        const signature = await sendTx(tx);

        return signature;
      },
      {
        loading: 'Withdrawing...',
        success: async (signature) => {
          await earningsMutate(
            (prev) => {
              if (!prev) {
                throw new Error('Store token accounts should not be null.');
              }

              return prev.map((account) => ({
                ...account,
                amount: 0,
              }));
            },
            {
              revalidate: true,
            }
          );

          setIsWithdrawing(false);

          return (
            <TransactionToast
              title="Earnings withdrawn!"
              link={getTransactionLink(signature)}
            />
          );
        },
        error: (err) => {
          console.error(err);
          setIsWithdrawing(false);
          return err.message || 'Something went wrong.';
        },
      }
    );
  }, [
    publicKey,
    signTransaction,
    earningsData,
    priorityFee,
    getTransactionLink,
    earningsMutate,
    connection,
  ]);

  return (
    <>
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <SectionHeader text="Your Earnings" />
        <Button
          size={'sm'}
          onClick={onWithdraw}
          disabled={isWithdrawing || totalBalance === 0}
        >
          <HandCoins />
          Withdraw All
        </Button>
      </div>
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
          {earningsLoading ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center">
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
    </>
  );
}
