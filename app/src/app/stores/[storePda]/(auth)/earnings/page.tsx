'use client';

import { InfoTooltip } from '@/components/InfoTooltip';
import { MainSection } from '@/components/MainSection';
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
import { withdrawEarningsIx } from '@/lib/instructions';
import { getStorePda } from '@/lib/pda';
import { buildTx, getTransactionLink } from '@/lib/client/solana';
import { atomicToUsd } from '@/lib/utils';
import { usePyth } from '@/providers/PythProvider';
import { useStoreTokenAccount } from '@/providers/StoreTokenAccountProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { PublicKey } from '@solana/web3.js';
import { HandCoins } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { sendTx } from '@/lib/api';

export default function Page() {
  const { publicKey, signTransaction } = useUnifiedWallet();
  const {
    storeTokenAccountsData,
    storeTokenAccountsLoading,
    storeTokenAccountsMutate,
  } = useStoreTokenAccount();
  const { pricesData, pricesIsLoading } = usePyth();
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const balanceRows = useMemo(() => {
    if (!storeTokenAccountsData || !pricesData) return [];

    return storeTokenAccountsData.map(({ amount, mint }) => {
      const metadata = ACCEPTED_MINTS_METADATA.get(mint);

      if (!metadata) {
        throw new Error(`Metadata not found for mint: ${mint}`);
      }

      const mintPrice = pricesData?.find((p) => {
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
  }, [storeTokenAccountsData, pricesData]);

  const totalBalance = balanceRows.reduce(
    (sum, row) => sum + Number(row.balance),
    0
  );

  function onWithdraw() {
    toast.promise(
      async () => {
        if (!publicKey || !signTransaction) {
          throw new Error('Wallet not connected.');
        }

        if (!storeTokenAccountsData) {
          throw new Error('No store associated token accounts found.');
        }

        setIsWithdrawing(true);

        let tx = await buildTx(
          await Promise.all(
            storeTokenAccountsData
              .filter(({ amount }) => amount > 0)
              .map(async ({ mint }) => {
                const metadata = ACCEPTED_MINTS_METADATA.get(mint);

                if (!metadata) {
                  throw new Error(`Metadata not found for mint: ${mint}`);
                }

                return await withdrawEarningsIx({
                  authority: publicKey,
                  paymentMint: new PublicKey(mint),
                  storePda: getStorePda(publicKey),
                  tokenProgram: metadata.owner,
                });
              })
          ),
          publicKey
        );

        tx = await signTransaction(tx);
        const signature = await sendTx(tx);

        return signature;
      },
      {
        loading: 'Withdrawing...',
        success: async (signature) => {
          await storeTokenAccountsMutate((prev) => {
            if (!prev) {
              throw new Error('Store token accounts should not be null.');
            }

            return prev.map((account) => ({
              ...account,
              amount: 0,
            }));
          });

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
  }

  return (
    <MainSection className="flex-1">
      <div className="flex w-full items-center justify-between">
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
          {storeTokenAccountsLoading || pricesIsLoading ? (
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
    </MainSection>
  );
}
