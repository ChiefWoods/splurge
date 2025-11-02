'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { Dialog, DialogHeader, DialogTrigger } from '../ui/dialog';
import { ParsedOrderStatus } from '@/types/accounts';
import { Button } from '../ui/button';
import { Pencil, Truck, X } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from 'sonner';
import { buildTx } from '@/lib/client/solana';
import { useConfig } from '@/providers/ConfigProvider';
import { PublicKey } from '@solana/web3.js';
import { sendPermissionedTx } from '@/lib/api';
import {
  atomicToUsd,
  capitalizeFirstLetter,
  truncateAddress,
} from '@/lib/utils';
import { useOrders } from '@/providers/OrdersProvider';
import { usePersonalStore } from '@/providers/PersonalStoreProvider';
import { TransactionToast } from '../TransactionToast';
import { alertOrderUpdate } from '@/lib/server/dialect';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '../FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormCancelButton } from '../FormCancelButton';
import { LargeImage } from '../LargeImage';
import { useProgram } from '@/providers/ProgramProvider';
import { useSettings } from '@/providers/SettingsProvider';

export function UpdateOrderDialog({
  name,
  image,
  amount,
  address,
  status,
  orderPda,
  orderTimestamp,
  paymentSubtotal,
  itemPda,
  paymentMint,
  storePda,
  authority,
}: {
  name: string;
  image: string;
  amount: number;
  address: string;
  status: ParsedOrderStatus;
  orderPda: string;
  orderTimestamp: number;
  paymentSubtotal: number;
  itemPda: string;
  paymentMint: string;
  storePda: string;
  authority: string;
}) {
  const { connection } = useConnection();
  const { signMessage } = useUnifiedWallet();
  const { splurgeClient, tuktukClient } = useProgram();
  const { getTransactionLink } = useSettings();
  const { checkAuth } = useWalletAuth();
  const { configData } = useConfig();
  const { personalStoreData } = usePersonalStore();
  const { ordersMutate } = useOrders();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = useCallback(
    (status: ParsedOrderStatus) => {
      toast.promise(
        async () => {
          if (!signMessage) {
            throw new Error('Wallet not connected.');
          }

          if (!configData) {
            throw new Error('Config account not created.');
          }

          if (!personalStoreData) {
            throw new Error('Store account not created.');
          }

          setIsSubmitting(true);

          const admin = new PublicKey(configData.admin);
          const authorityPubkey = new PublicKey(authority);
          const orderPdaPubkey = new PublicKey(orderPda);
          const shopperPda = splurgeClient.getShopperPda(authorityPubkey);

          const paymentMintPubkey = new PublicKey(paymentMint);
          const mintAcc = await connection.getAccountInfo(paymentMintPubkey);

          if (!mintAcc) {
            throw new Error('Mint account not found.');
          }

          const tokenProgram = mintAcc.owner;

          const tx = await buildTx(
            splurgeClient.connection,
            [
              status === 'shipping'
                ? await splurgeClient.shipOrderIx({
                    admin,
                    orderPda: orderPdaPubkey,
                    authority: authorityPubkey,
                    itemPda: new PublicKey(itemPda),
                    paymentMint: paymentMintPubkey,
                    shopperPda,
                    storePda: new PublicKey(storePda),
                    tokenProgram,
                    tuktukProgram: tuktukClient.program,
                  })
                : await splurgeClient.cancelOrderIx({
                    admin,
                    orderPda: orderPdaPubkey,
                    paymentMint: paymentMintPubkey,
                    shopperPda,
                    tokenProgram,
                  }),
            ],
            admin
          );

          await signMessage(
            new TextEncoder().encode(
              `Update order ${truncateAddress(orderPda)} to '${capitalizeFirstLetter(status)}' status.`
            )
          );

          const signature = await sendPermissionedTx(tx);

          return {
            signature,
            storeName: personalStoreData.name,
          };
        },
        {
          loading: 'Waiting for signature...',
          success: async ({ signature, storeName }) => {
            await ordersMutate((prev) => {
              if (!prev) {
                throw new Error('Orders should not be null.');
              }

              return prev.map((order) => {
                if (order.publicKey === orderPda) {
                  return {
                    ...order,
                    status,
                  };
                } else {
                  return order;
                }
              });
            });

            setIsOpen(false);
            setIsSubmitting(false);

            const paymentMintSymbol =
              ACCEPTED_MINTS_METADATA.get(paymentMint)?.symbol;

            if (!paymentMintSymbol) {
              throw new Error('Payment mint not found.');
            }

            await alertOrderUpdate({
              itemAmount: amount,
              itemName: name,
              orderPda,
              orderTimestamp,
              paymentMintSymbol,
              paymentSubtotal: atomicToUsd(paymentSubtotal),
              storeName,
              shopperAuthority: authority,
              status,
            });

            return (
              <TransactionToast
                title="Order updated!"
                link={getTransactionLink(signature)}
              />
            );
          },
          error: (err) => {
            console.error(err);
            setIsSubmitting(false);
            return err.message || 'Something went wrong.';
          },
        }
      );
    },
    [
      ordersMutate,
      connection,
      configData,
      orderPda,
      personalStoreData,
      signMessage,
      itemPda,
      paymentMint,
      storePda,
      authority,
      amount,
      name,
      orderTimestamp,
      paymentSubtotal,
      splurgeClient,
      tuktukClient,
      getTransactionLink,
    ]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <StatusBadge
          status={status}
          className="cursor-pointer"
          onClick={() => checkAuth(() => setIsOpen(true))}
        >
          <Pencil size={12} className="text-background" />
        </StatusBadge>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Update Order" />
        </DialogHeader>
        <section className="flex flex-col items-stretch gap-y-4">
          <LargeImage src={image} alt={name} />
          <div className="flex flex-col gap-2">
            <h3 className="truncate font-medium">{name}</h3>
            <p className="text-sm">Amount - {amount}</p>
            <p className="text-sm">{address}</p>
          </div>
          <FormDialogFooter>
            <FormCancelButton onClick={() => setIsOpen(false)} />
            <Button
              size={'sm'}
              onClick={() => onSubmit('shipping')}
              disabled={isSubmitting}
              className="bg-completed transition-colors hover:bg-completed/90"
            >
              <Truck className="size-4" />
              Shipped
            </Button>
            <Button
              size={'sm'}
              onClick={() => onSubmit('cancelled')}
              disabled={isSubmitting}
              className="bg-cancelled transition-colors hover:bg-cancelled/90"
            >
              <X className="size-4" />
              Reject
            </Button>
          </FormDialogFooter>
        </section>
      </FormDialogContent>
    </Dialog>
  );
}
