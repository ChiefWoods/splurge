'use client';

import { zAmount, zPaymentMint } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TransactionToast } from '../TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/solana-helpers';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { WalletGuardButton } from '../WalletGuardButton';
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
import { Loader2, Package } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { z } from 'zod';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { createOrderIx } from '@/lib/instructions';
import { confirmTransaction } from '@solana-developers/helpers';
import { useItem } from '@/providers/ItemProvider';
import { atomicToUsd } from '@/lib/utils';

export function CheckoutDialog({
  name,
  image,
  price,
  maxAmount,
  storePda,
  itemPda,
  btnVariant = 'secondary',
  btnSize = 'sm',
  children,
}: {
  name: string;
  image: string;
  price: number;
  maxAmount: number;
  storePda: string;
  itemPda: string;
  btnVariant?: 'default' | 'secondary';
  btnSize?: 'sm' | 'icon';
  children: ReactNode;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { allItems } = useItem();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  const createOrderSchema = z.object({
    amount: zAmount.max(maxAmount, 'Amount exceeds inventory count.'),
    paymentMint: zPaymentMint,
  });

  type CreateOrderFormData = z.infer<typeof createOrderSchema>;

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      amount: 1,
      paymentMint: ACCEPTED_MINTS_METADATA.keys().next().value,
    },
  });

  function onSubmit(data: CreateOrderFormData) {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsSubmitting(true);

        const token = ACCEPTED_MINTS_METADATA.get(data.paymentMint);

        if (!token) {
          throw new Error('Payment mint not whitelisted.');
        }

        const tx = await buildTx(
          [
            await createOrderIx({
              amount: data.amount,
              authority: publicKey,
              storePda: new PublicKey(storePda),
              itemPda: new PublicKey(itemPda),
              paymentMint: new PublicKey(data.paymentMint),
              tokenProgram: token.owner,
            }),
          ],
          publicKey
        );

        const signature = await sendTransaction(tx, connection);

        await confirmTransaction(connection, signature);

        return signature;
      },
      {
        loading: 'Waiting for signature...',
        success: async (signature) => {
          await allItems.trigger(
            {},
            {
              optimisticData: (prev) => {
                if (prev) {
                  return prev.map((item) => {
                    if (item.publicKey === itemPda) {
                      return {
                        ...item,
                        inventoryCount: item.inventoryCount - data.amount,
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
          form.reset();
          setIsSubmitting(false);
          setIsOpen(false);

          return (
            <TransactionToast
              title="Order created!"
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

  useEffect(() => {
    if (isOpen) {
      setOrderTotal(price * form.getValues('amount'));
    }
  }, [isOpen, price, form]);

  useEffect(() => {
    const currentAmount = form.getValues('amount');
    if (currentAmount > maxAmount) {
      form.setValue('amount', maxAmount);
      setOrderTotal(price * maxAmount);
    }
  }, [maxAmount, price, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton
          variant={btnVariant}
          size={btnSize}
          setOpen={setIsOpen}
        >
          {children}
        </WalletGuardButton>
      </DialogTrigger>
      <DialogContent className="max-h-[500px] overflow-scroll sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Checkout
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col items-stretch gap-y-4"
          >
            <Image
              src={image}
              alt={name}
              width={200}
              height={200}
              className="aspect-square self-center rounded-lg border"
              priority
            />
            <h3 className="truncate">{name}</h3>
            <div className="flex w-full flex-col gap-y-2">
              <div className="flex justify-between gap-x-2">
                <p className="text-sm font-semibold">Price</p>
                <p>{atomicToUsd(price)} USD</p>
              </div>
              <div className="flex justify-between gap-x-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          min={1}
                          max={maxAmount}
                          step={1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                            if (!isNaN(value)) {
                              setOrderTotal(price * value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMint"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Payment Token</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment token" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from(ACCEPTED_MINTS_METADATA.entries()).map(
                            ([mint, { name, image, symbol }]) => (
                              <SelectItem key={mint} value={mint}>
                                <div className="flex items-center justify-start gap-x-2">
                                  <Image
                                    src={image}
                                    alt={name}
                                    width={20}
                                    height={20}
                                    className="rounded-full"
                                  />
                                  <p className="text-sm">{symbol}</p>
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex justify-between gap-x-2">
              <p className="text-sm font-semibold">Total</p>
              <p className="font-semibold">{atomicToUsd(orderTotal)} USD</p>
            </div>
            <DialogFooter className="flex w-full justify-end gap-4">
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
                  <Package className="h-4 w-4" />
                )}
                Place Order
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
