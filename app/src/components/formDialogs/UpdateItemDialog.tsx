'use client';

import { Pencil } from 'lucide-react';
import { WalletGuardButton } from '../WalletGuardButton';
import { useCallback, useState } from 'react';
import { Dialog, DialogHeader, DialogTrigger } from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { useForm } from 'react-hook-form';
import { UpdateItemFormData, updateItemSchema } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransactionToast } from '../TransactionToast';
import { buildTx, SPLURGE_CLIENT } from '@/lib/client/solana';
import { toast } from 'sonner';
import Image from 'next/image';
import { PublicKey } from '@solana/web3.js';
import { useItems } from '@/providers/ItemsProvider';
import { BN } from '@coral-xyz/anchor';
import { MINT_DECIMALS } from '@/lib/constants';
import { useConnection, useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '../FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';
import { sendTx } from '@/lib/api';
import { useSettings } from '@/providers/SettingsProvider';
import { ParsedItem } from '@/types/accounts';

export function UpdateItemDialog({
  item,
  storePda,
}: {
  item: ParsedItem;
  storePda: string;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { itemsMutate } = useItems();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateItemFormData>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      inventoryCount: item.inventoryCount,
      price: item.price,
    },
  });

  const onSubmit = useCallback(
    (data: UpdateItemFormData) => {
      toast.promise(
        async () => {
          if (!publicKey || !signTransaction) {
            throw new Error('Wallet not connected.');
          }

          setIsSubmitting(true);

          let tx = await buildTx(
            connection,
            [
              await SPLURGE_CLIENT.updateItemIx({
                price: new BN(Number(data.price.toFixed(2))),
                inventoryCount: data.inventoryCount,
                authority: publicKey,
                itemPda: new PublicKey(item.publicKey),
                storePda: new PublicKey(storePda),
              }),
            ],
            publicKey,
            [],
            priorityFee
          );

          tx = await signTransaction(tx);
          const signature = await sendTx(tx);

          return {
            signature,
            inventoryCount: data.inventoryCount,
            price: data.price,
          };
        },
        {
          loading: 'Waiting for signature...',
          success: async ({ signature, inventoryCount, price }) => {
            await itemsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error('Items should not be null.');
                }

                return prev.map((prevItem) => {
                  if (prevItem.publicKey === item.publicKey) {
                    return {
                      ...prevItem,
                      price: Number(price.toFixed(2)),
                      inventoryCount,
                    };
                  } else {
                    return prevItem;
                  }
                });
              },
              {
                revalidate: true,
              }
            );

            setIsOpen(false);
            form.reset({
              inventoryCount,
              price,
            });
            setIsSubmitting(false);

            return (
              <TransactionToast
                title="Item updated!"
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
      itemsMutate,
      form,
      item,
      publicKey,
      signTransaction,
      storePda,
      connection,
      getTransactionLink,
      priorityFee,
    ]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton variant="outline" size={'icon'} setOpen={setIsOpen}>
          <Pencil />
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Update Item" />
        </DialogHeader>
        <section className="flex items-start gap-x-4">
          <Image
            src={item.image}
            alt={item.name}
            width={100}
            height={100}
            className="aspect-square rounded-lg border"
            priority
          />
          <div className="flex flex-1 flex-col gap-y-1">
            <p className="truncate text-lg font-semibold">{item.name}</p>
            <p className="text-sm text-wrap">{item.description}</p>
          </div>
        </section>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="inventoryCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inventory Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value.toString()}
                      min={0}
                      step={1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price in USD</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value / 10 ** MINT_DECIMALS}
                      min={1}
                      step={0.01}
                      onChange={(e) => {
                        const usdValue = parseFloat(e.target.value);
                        field.onChange(
                          isNaN(usdValue)
                            ? 0
                            : Number(usdValue.toFixed(2)) * 10 ** MINT_DECIMALS
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDialogFooter>
              <FormCancelButton
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
              />
              <FormSubmitButton
                Icon={Pencil}
                disabled={isSubmitting}
                text="Update Item"
              />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
