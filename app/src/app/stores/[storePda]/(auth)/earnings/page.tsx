'use client';

import { InfoTooltip } from '@/components/InfoTooltip';
import { MintIcon } from '@/components/MintIcon';
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
import { buildTx, getTransactionLink } from '@/lib/solana-client';
import { atomicToUsd } from '@/lib/utils';
import { usePyth } from '@/providers/PythProvider';
import { useStoreTokenAccount } from '@/providers/StoreTokenAccountProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { confirmTransaction } from '@solana-developers/helpers';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { HandCoins } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RowBalance {
  name: string;
  image: string;
  balance: string;
}

export default function Page() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useUnifiedWallet();
  const {
    storeTokenAccountsData,
    storeTokenAccountsLoading,
    storeTokenAccountsMutate,
  } = useStoreTokenAccount();
  const { pricesData, pricesIsLoading } = usePyth();
  const [balanceRows, setBalanceRows] = useState<RowBalance[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  useEffect(() => {
    if (storeTokenAccountsData && pricesData) {
      let totalBalance = 0;

      setBalanceRows(
        storeTokenAccountsData.map(({ amount, mint }) => {
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
  }, [storeTokenAccountsData, pricesData]);

  function onWithdraw() {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        if (!storeTokenAccountsData) {
          throw new Error('No store associated token accounts found.');
        }

        setIsWithdrawing(true);

        const tx = await buildTx(
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

        const signature = await sendTransaction(tx, connection);

        await confirmTransaction(connection, signature);

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
          return err.message;
        },
      }
    );
  }

  return (
    <section className="main-section flex-1">
      <div className="flex w-full items-center justify-between">
        <h2 className="w-full text-start">Your Earnings</h2>
        <Button
          size={'sm'}
          onClick={onWithdraw}
          disabled={isWithdrawing || !totalBalance}
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
    </section>
  );
}
