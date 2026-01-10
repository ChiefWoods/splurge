'use client';

import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { Dialog, DialogHeader, DialogTrigger } from '../ui/dialog';
import {
  ParsedConfig,
  ParsedItem,
  ParsedOrder,
  ParsedOrderStatus,
  ParsedShopper,
} from '@/types/accounts';
import { Button } from '../ui/button';
import { Pencil, Truck, X } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { toast } from 'sonner';
import { buildTx, SPLURGE_CLIENT, TUKTUK_CLIENT } from '@/lib/client/solana';
import { PublicKey } from '@solana/web3.js';
import { sendPermissionedTx } from '@/lib/api';
import {
  atomicToUsd,
  capitalizeFirstLetter,
  truncateAddress,
} from '@/lib/utils';
import { useOrders } from '@/providers/OrdersProvider';
import { TransactionToast } from '../TransactionToast';
import { alertOrderUpdate } from '@/lib/server/dialect';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '../FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormCancelButton } from '../FormCancelButton';
import { LargeImage } from '../LargeImage';
import { useSettings } from '@/providers/SettingsProvider';
import { SplurgeClient } from '@/classes/SplurgeClient';
import { useStore } from '@/providers/StoreProvider';

export function UpdateOrderDialog({
  config,
  order,
  item,
  shopper,
  storePda,
}: {
  config: ParsedConfig;
  order: ParsedOrder;
  item: ParsedItem;
  shopper: ParsedShopper;
  storePda: string;
}) {
  const { connection } = useConnection();
  const { signMessage } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { checkAuth } = useWalletAuth();
  const { storeData } = useStore();
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

          if (!storeData) {
            throw new Error('Store account not created.');
          }

          setIsSubmitting(true);

          const admin = new PublicKey(config.admin);
          const authorityPubkey = new PublicKey(shopper.authority);
          const orderPdaPubkey = new PublicKey(order.publicKey);
          const shopperPda = SplurgeClient.getShopperPda(authorityPubkey);

          const paymentMintPubkey = new PublicKey(order.paymentMint);
          const mintAcc = await connection.getAccountInfo(paymentMintPubkey);

          if (!mintAcc) {
            throw new Error('Mint account not found.');
          }

          const tokenProgram = mintAcc.owner;

          const tx = await buildTx(
            connection,
            [
              status === 'shipping'
                ? await SPLURGE_CLIENT.shipOrderIx({
                    admin,
                    orderPda: orderPdaPubkey,
                    authority: authorityPubkey,
                    itemPda: new PublicKey(item.publicKey),
                    paymentMint: paymentMintPubkey,
                    shopperPda,
                    storePda: new PublicKey(storePda),
                    tokenProgram,
                    tuktukProgram: TUKTUK_CLIENT.program,
                  })
                : await SPLURGE_CLIENT.cancelOrderIx({
                    admin,
                    orderPda: orderPdaPubkey,
                    paymentMint: paymentMintPubkey,
                    shopperPda,
                    tokenProgram,
                  }),
            ],
            admin,
            [],
            priorityFee
          );

          await signMessage(
            new TextEncoder().encode(
              `Update order ${truncateAddress(order.publicKey)} to '${capitalizeFirstLetter(status)}' status.`
            )
          );

          const signature = await sendPermissionedTx(tx);

          return {
            signature,
            storeName: storeData.name,
          };
        },
        {
          loading: 'Waiting for signature...',
          success: async ({ signature, storeName }) => {
            await ordersMutate(
              (prev) => {
                if (!prev) {
                  throw new Error('Orders should not be null.');
                }

                return prev.map((prevOrder) => {
                  if (prevOrder.publicKey === order.publicKey) {
                    return {
                      ...prevOrder,
                      status,
                    };
                  } else {
                    return prevOrder;
                  }
                });
              },
              {
                revalidate: true,
              }
            );

            setIsOpen(false);
            setIsSubmitting(false);

            const paymentMintSymbol = ACCEPTED_MINTS_METADATA.get(
              order.paymentMint
            )?.symbol;

            if (!paymentMintSymbol) {
              throw new Error('Payment mint not found.');
            }

            await alertOrderUpdate({
              itemAmount: order.amount,
              itemName: item.name,
              orderPda: order.publicKey,
              orderTimestamp: order.timestamp,
              paymentMintSymbol,
              paymentSubtotal: atomicToUsd(order.paymentSubtotal),
              storeName,
              shopperAuthority: shopper.authority,
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
      config,
      storeData,
      signMessage,
      storePda,
      getTransactionLink,
      priorityFee,
      shopper,
      order,
      item,
    ]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <StatusBadge
          status={order.status}
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
          <LargeImage src={item.image} alt={item.name} />
          <div className="flex flex-col gap-2">
            <h3 className="truncate font-medium">{shopper.name}</h3>
            <p className="text-sm">Amount - {order.amount}</p>
            <p className="text-sm">{shopper.address}</p>
          </div>
          <FormDialogFooter>
            <FormCancelButton onClick={() => setIsOpen(false)} />
            <Button
              size={'sm'}
              onClick={() => onSubmit('shipping')}
              disabled={isSubmitting}
              className="bg-completed hover:bg-completed/90 transition-colors"
            >
              <Truck className="size-4" />
              Shipped
            </Button>
            <Button
              size={'sm'}
              onClick={() => onSubmit('cancelled')}
              disabled={isSubmitting}
              className="bg-cancelled hover:bg-cancelled/90 transition-colors"
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
