'use client';

import { Loader2, Pencil } from 'lucide-react';
import { WalletGuardButton } from '../WalletGuardButton';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { UpdateItemFormData, updateItemSchema } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransactionToast } from '../TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/solana-helpers';
import { toast } from 'sonner';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import Image from 'next/image';
import { updateItemIx } from '@/lib/instructions';
import { PublicKey } from '@solana/web3.js';
import { confirmTransaction } from '@solana-developers/helpers';
import { useItem } from '@/providers/ItemProvider';
import { BN } from '@coral-xyz/anchor';
import { MINT_DECIMALS } from '@/lib/constants';
import { atomicToUsd } from '@/lib/utils';

export function UpdateItemDialog({
  name,
  image,
  description,
  price,
  inventoryCount,
  itemPda,
  storePda,
}: {
  name: string;
  image: string;
  description: string;
  price: number;
  inventoryCount: number;
  itemPda: string;
  storePda: string;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { allItems } = useItem();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateItemFormData>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      inventoryCount,
      price,
    },
  });

  function onSubmit(data: UpdateItemFormData) {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsSubmitting(true);

        const tx = await buildTx(
          [
            await updateItemIx({
              price: new BN(Number(data.price.toFixed(2))),
              inventoryCount: data.inventoryCount,
              authority: publicKey,
              itemPda: new PublicKey(itemPda),
              storePda: new PublicKey(storePda),
            }),
          ],
          publicKey
        );

        const signature = await sendTransaction(tx, connection);

        await confirmTransaction(connection, signature);

        return {
          signature,
          inventoryCount: data.inventoryCount,
          price: data.price,
        };
      },
      {
        loading: 'Waiting for signature...',
        success: async ({ signature, inventoryCount, price }) => {
          await allItems.trigger(
            { storePda },
            {
              optimisticData: (prev) => {
                if (prev) {
                  return prev.map((item) => {
                    if (item.publicKey === itemPda) {
                      return {
                        ...item,
                        price: Number(data.price.toFixed(2)),
                        inventoryCount:
                          item.inventoryCount - data.inventoryCount,
                      };
                    }
                    return item;
                  });
                } else {
                  return [];
                }
              },
            }
          );
          form.reset({
            inventoryCount,
            price,
          });
          setIsSubmitting(false);
          setIsOpen(false);

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
          return err.message;
        },
      }
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton variant="outline" size={'icon'} setOpen={setIsOpen}>
          <Pencil />
        </WalletGuardButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[500px] flex-col overflow-scroll sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Update Item
          </DialogTitle>
        </DialogHeader>
        <section className="flex items-start gap-x-4">
          <Image
            src={image}
            alt={name}
            width={100}
            height={100}
            className="aspect-square rounded-lg border"
            priority
          />
          <div className="flex flex-1 flex-col gap-y-1">
            <p className="truncate text-lg font-semibold">{name}</p>
            <p className="muted-text text-wrap">{description}</p>
          </div>
        </section>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <DialogFooter className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                Update Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
