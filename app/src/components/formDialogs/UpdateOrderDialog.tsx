'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
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
import { updateOrderIx } from '@/lib/instructions';
import { useConfig } from '@/providers/ConfigProvider';
import { PublicKey } from '@solana/web3.js';
import { updateOrder } from '@/lib/api';
import { confirmTransaction } from '@solana-developers/helpers';
import { capitalizeFirstLetter, truncateAddress } from '@/lib/utils';
import { useOrder } from '@/providers/OrderProvider';
import { useStore } from '@/providers/StoreProvider';
import { TransactionToast } from '../TransactionToast';
import { getShopperPda } from '@/lib/pda';

export function UpdateOrderDialog({
  name,
  image,
  amount,
  address,
  status,
  orderPda,
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
  itemPda: string;
  paymentMint: string;
  storePda: string;
  authority: string;
}) {
  const { connection } = useConnection();
  const { signMessage } = useWallet();
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

          const tx = await buildTx(
            [
              await updateOrderIx({
                status,
                admin,
                orderPda: new PublicKey(orderPda),
                authority: authorityPubkey,
                itemPda: new PublicKey(itemPda),
                paymentMint: new PublicKey(paymentMint),
                shopperPda: getShopperPda(authorityPubkey),
                storePda: new PublicKey(storePda),
              }),
            ],
            admin
          );

          await signMessage(
            new TextEncoder().encode(
              `Update order ${truncateAddress(orderPda)} to '${capitalizeFirstLetter(Object.keys(status)[0])}' status.`
            )
          );

          const signature = await updateOrder(tx);

          await confirmTransaction(connection, signature);

          return {
            signature,
            storePda: personalStoreData.publicKey,
          };
        },
        {
          loading: 'Waiting for signature...',
          success: async ({ signature, storePda }) => {
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
