'use client';

import { zAmount, zPaymentMint } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection } from '@solana/wallet-adapter-react';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { TransactionToast } from '../TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/client/solana';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import { Dialog, DialogHeader, DialogTrigger } from '../ui/dialog';
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
import { Package } from 'lucide-react';
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
import { useItems } from '@/providers/ItemsProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { atomicToUsd, removeTrailingZeroes } from '@/lib/utils';
import { useConfig } from '@/providers/ConfigProvider';
import { MAX_FEE_BASIS_POINTS } from '@solana/spl-token';
import { Skeleton } from '../ui/skeleton';
import { MintIcon } from '../MintIcon';
import { usePyth } from '@/providers/PythProvider';
import { alertNewOrders, alertOutOfStock } from '@/lib/server/dialect';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { MINT_DECIMALS } from '@/lib/constants';
import { FormDialogTitle } from '@/components/FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';
import { LargeImage } from '../LargeImage';

export function CheckoutDialog({
  name,
  image,
  price,
  maxAmount,
  storePda,
  storeAuthority,
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
  storeAuthority: string;
  itemPda: string;
  btnVariant?: 'default' | 'secondary';
  btnSize?: 'sm' | 'icon';
  children: ReactNode;
}) {
  const { connection } = useConnection();
  const { publicKey } = useUnifiedWallet();
  const { pythSolanaReceiver, getUpdatePriceFeedTx } = usePyth();
  const { configData, configLoading } = useConfig();
  const { itemsMutate } = useItems();
  const { shopperData } = useShopper();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const amount = useWatch({
    control: form.control,
    name: 'amount',
  });
  const orderSubtotal = useMemo(() => price * (amount || 0), [price, amount]);

  const platformFee = useMemo(() => {
    return configData
      ? Math.floor(
          (orderSubtotal * configData.orderFeeBps) / MAX_FEE_BASIS_POINTS
        )
      : 0;
  }, [configData, orderSubtotal]);

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    form.reset();
  }, [form]);

  const onSubmit = useCallback(
    (data: CreateOrderFormData) => {
      toast.promise(
        async () => {
          if (!publicKey) {
            throw new Error('Wallet not connected.');
          }

          if (!pythSolanaReceiver) {
            throw new Error('Pyth Solana Receiver not initialized');
          }

          if (!shopperData) {
            throw new Error('Shopper account not created.');
          }

          if (configData?.isPaused) {
            throw new Error(
              'Platform is currently paused. No new orders can be created.'
            );
          }

          setIsSubmitting(true);

          const token = ACCEPTED_MINTS_METADATA.get(data.paymentMint);

          if (!token) {
            throw new Error('Payment mint not found.');
          }

          const signatures = await pythSolanaReceiver.provider.sendAll([
            ...(await getUpdatePriceFeedTx(token.id)),
            {
              tx: await buildTx(
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
              ),
              signers: [],
            },
          ]);

          // actual transaction starts from index 1
          await confirmTransaction(connection, signatures[1]);

          return {
            signature: signatures[1],
            shopperData,
            paymentMintSymbol: token.symbol,
          };
        },
        {
          loading: 'Waiting for signature...',
          success: async ({ signature, shopperData, paymentMintSymbol }) => {
            const newInventoryCount = maxAmount - data.amount;

            await itemsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error('Items should not be null.');
                }

                return prev.map((item) => {
                  if (item.publicKey === itemPda) {
                    return {
                      ...item,
                      inventoryCount: newInventoryCount,
                    };
                  } else {
                    return item;
                  }
                });
              },
              {
                revalidate: false,
              }
            );

            closeAndReset();
            setIsSubmitting(false);

            await alertNewOrders({
              storeAuthority,
              shopperName: shopperData.name,
              itemName: name,
              itemAmount: data.amount,
              shopperAddress: shopperData.address,
              paymentSubtotal: atomicToUsd(orderSubtotal),
              paymentMintSymbol,
            });

            if (newInventoryCount === 0) {
              await alertOutOfStock({
                itemName: name,
                storeAuthority,
              });
            }

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
            return err.message || 'Something went wrong.';
          },
        }
      );
    },
    [
      publicKey,
      configData,
      shopperData,
      storePda,
      itemPda,
      connection,
      itemsMutate,
      pythSolanaReceiver,
      getUpdatePriceFeedTx,
      maxAmount,
      name,
      storeAuthority,
      orderSubtotal,
      closeAndReset,
    ]
  );

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
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Checkout" />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <LargeImage src={image} alt={name} />
            <h3 className="truncate text-base font-medium">{name}</h3>
            <div className="flex w-full flex-col gap-y-2">
              <div className="flex justify-between gap-x-2">
                <p className="text-sm">Price</p>
                <p className="text-sm">{atomicToUsd(price)} USD</p>
              </div>
              <div className="flex justify-between gap-x-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
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
                    <FormItem className="flex-1">
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
                              <SelectItem
                                key={mint}
                                value={mint}
                                className="cursor-pointer"
                              >
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
                {configLoading ? (
                  <Skeleton className="w-[80px]" />
                ) : (
                  configData && (
                    <p className="text-sm">
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
                {configLoading ? (
                  <Skeleton className="w-[80px]" />
                ) : (
                  configData && (
                    <p className="text-sm">{atomicToUsd(orderSubtotal)} USD</p>
                  )
                )}
              </div>
              <div className="flex justify-between gap-x-2">
                <p className="text-sm font-semibold">Total</p>
                {configLoading ? (
                  <Skeleton className="w-[80px]" />
                ) : (
                  configData && (
                    <p className="text-sm font-semibold">
                      {removeTrailingZeroes(
                        atomicToUsd(orderSubtotal + platformFee, MINT_DECIMALS)
                      )}{' '}
                      USD
                    </p>
                  )
                )}
              </div>
            </div>
            <FormDialogFooter>
              <FormCancelButton onClick={closeAndReset} />
              <FormSubmitButton
                Icon={Package}
                disabled={isSubmitting}
                text="Place Order"
              />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
