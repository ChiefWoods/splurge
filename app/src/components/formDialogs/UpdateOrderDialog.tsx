'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { OrderStatus } from '@/types/accounts';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Pencil, Truck, X } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from 'sonner';
import { buildTx, getTransactionLink } from '@/lib/solana-helpers';
import { cancelOrderIx, shipOrderIx } from '@/lib/instructions';
import { useConfig } from '@/providers/ConfigProvider';
import { PublicKey } from '@solana/web3.js';
import { sendPermissionedTx } from '@/lib/api';
import { confirmTransaction } from '@solana-developers/helpers';
import {
  atomicToUsd,
  capitalizeFirstLetter,
  truncateAddress,
} from '@/lib/utils';
import { useOrder } from '@/providers/OrderProvider';
import { useStore } from '@/providers/StoreProvider';
import { TransactionToast } from '../TransactionToast';
import { getShopperPda } from '@/lib/pda';
import { alertOrderUpdate } from '@/lib/dialect';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';

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
  status: string;
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
  const { checkAuth } = useWalletAuth();
  const { configData } = useConfig();
  const { personalStoreData } = useStore();
  const { allOrdersTrigger } = useOrder();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = useCallback(
    (status: OrderStatus) => {
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
          const shopperPda = getShopperPda(authorityPubkey);

          const paymentMintPubkey = new PublicKey(paymentMint);
          const mintAcc = await connection.getAccountInfo(paymentMintPubkey);

          if (!mintAcc) {
            throw new Error('Mint account not found.');
          }

          const tokenProgram = mintAcc.owner;

          const tx = await buildTx(
            [
              Object.keys(status)[0] === 'shipping'
                ? await shipOrderIx({
                    admin,
                    orderPda: orderPdaPubkey,
                    authority: authorityPubkey,
                    itemPda: new PublicKey(itemPda),
                    paymentMint: paymentMintPubkey,
                    shopperPda,
                    storePda: new PublicKey(storePda),
                    tokenProgram,
                  })
                : await cancelOrderIx({
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
              `Update order ${truncateAddress(orderPda)} to '${capitalizeFirstLetter(Object.keys(status)[0])}' status.`
            )
          );

          const signature = await sendPermissionedTx(tx);

          await confirmTransaction(connection, signature);

          return {
            signature,
            storePda: personalStoreData.publicKey,
            storeName: personalStoreData.name,
          };
        },
        {
          loading: 'Waiting for signature...',
          success: async ({ signature, storePda, storeName }) => {
            await allOrdersTrigger(
              {
                storePda,
              },
              {
                optimisticData: (prev) => {
                  if (prev) {
                    return prev.map((order) => {
                      if (order.publicKey === orderPda) {
                        return {
                          ...order,
                          status,
                        };
                      }
                      return order;
                    });
                  } else {
                    return [];
                  }
                },
              }
            );

            setIsSubmitting(false);
            setIsOpen(false);

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
            return err.message;
          },
        }
      );
    },
    [
      allOrdersTrigger,
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
          <Pencil size={12} />
        </StatusBadge>
      </DialogTrigger>
      <DialogContent className="max-h-[500px] overflow-scroll sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Update Order
          </DialogTitle>
        </DialogHeader>
        <section className="flex flex-col items-stretch gap-y-4">
          <Image
            src={image}
            alt={name}
            width={200}
            height={200}
            className="aspect-square self-center rounded-lg border"
            priority
          />
          <div className="flex flex-col gap-2">
            <h3 className="truncate">{name}</h3>
            <p className="text-sm">Amount - {amount}</p>
            <p className="text-sm">{address}</p>
          </div>
          <DialogFooter className="flex w-full justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onSubmit({ shipping: {} })}
              disabled={isSubmitting}
              className="bg-completed hover:bg-completed-hover"
            >
              <Truck className="h-4 w-4" />
              Shipped
            </Button>
            <Button
              onClick={() => onSubmit({ cancelled: {} })}
              disabled={isSubmitting}
              className="bg-cancelled hover:bg-cancelled-hover"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </DialogFooter>
        </section>
      </DialogContent>
    </Dialog>
  );
}
