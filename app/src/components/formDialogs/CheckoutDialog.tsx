'use client';

import { zAmount, zPaymentMint } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
import { ACCEPTED_MINTS_METADATA, MINT_DECIMALS } from '@/lib/constants';
import { createOrderIx } from '@/lib/instructions';
import { confirmTransaction } from '@solana-developers/helpers';
import { useItem } from '@/providers/ItemProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { atomicToUsd, removeTrailingZeroes } from '@/lib/utils';
import { useConfig } from '@/providers/ConfigProvider';
import { MAX_FEE_BASIS_POINTS } from '@solana/spl-token';
import { Skeleton } from '../ui/skeleton';
import { MintIcon } from '../MintIcon';

export function CheckoutDialog({
  name,
  image,
  price,
  maxAmount,
  storePda,
  itemPda,
  btnVariant = 'default',
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
  const { configData, configIsLoading } = useConfig();
  const { allItemsTrigger } = useItem();
  const { shopperData } = useShopper();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSubtotal, setOrderSubtotal] = useState<number>(0);

  const platformFee = useMemo(() => {
    return configData
      ? Math.floor(
          (orderSubtotal * configData.orderFeeBps) / MAX_FEE_BASIS_POINTS
        )
      : 0;
  }, [configData, orderSubtotal]);

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

  const onSubmit = useCallback(
    (data: CreateOrderFormData) => {
      toast.promise(
        async () => {
          if (!publicKey) {
            throw new Error('Wallet not connected.');
          }

          if (!shopperData) {
            throw new Error('Shopper account not created.');
          }

          setIsSubmitting(true);

          const token = ACCEPTED_MINTS_METADATA.get(data.paymentMint);

          if (!token) {
            throw new Error('Payment mint not found.');
          }

          const tx = await buildTx(
            [
              await createOrderIx({
                amount: data.amount,
                authority: publicKey,
                storePda: new PublicKey(storePda),
                itemPda: new PublicKey(itemPda),
                priceUpdateV2: token.priceUpdateV2,
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
            await allItemsTrigger(
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
    },
    [
      publicKey,
      shopperData,
      storePda,
      itemPda,
      sendTransaction,
      connection,
      allItemsTrigger,
      form,
    ]
  );

  useEffect(() => {
    if (isOpen) {
      setOrderSubtotal(price * form.getValues('amount'));
    }
  }, [isOpen, price, form]);

  useEffect(() => {
    const currentAmount = form.getValues('amount');
    if (currentAmount > maxAmount) {
      form.setValue('amount', maxAmount);
      setOrderSubtotal(price * maxAmount);
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
                <p className="text-sm">Price</p>
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
                              setOrderSubtotal(price * value);
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
                          {/* Accepted mints should be obtained from config account, but hardcoded here due to devnet constraints */}
                          {Array.from(ACCEPTED_MINTS_METADATA.entries()).map(
                            ([mint, { name, image, symbol }]) => (
                              <SelectItem key={mint} value={mint}>
                                <div className="flex items-center justify-start gap-x-2">
                                  <MintIcon src={image} alt={name} />
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
            <div className="flex flex-col gap-1">
              <div className="flex justify-between gap-x-2">
                <p className="text-sm">Platform Fee</p>
                {configIsLoading ? (
                  <Skeleton className="w-[80px]" />
                ) : (
                  configData && (
                    <p>
                      {removeTrailingZeroes(
                        atomicToUsd(platformFee, MINT_DECIMALS)
                      )}{' '}
                      USD
                    </p>
                  )
                )}
              </div>
              <div className="flex justify-between gap-x-2">
                <p className="text-sm">Subtotal</p>
                {configIsLoading ? (
                  <Skeleton className="w-[80px]" />
                ) : (
                  configData && <p>{atomicToUsd(orderSubtotal)} USD</p>
                )}
              </div>
              <div className="flex justify-between gap-x-2">
                <p className="text-sm font-semibold">Total</p>
                {configIsLoading ? (
                  <Skeleton className="w-[80px]" />
                ) : (
                  configData && (
                    <p className="font-semibold">
                      {removeTrailingZeroes(
                        atomicToUsd(orderSubtotal + platformFee, MINT_DECIMALS)
                      )}{' '}
                      USD
                    </p>
                  )
                )}
              </div>
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
