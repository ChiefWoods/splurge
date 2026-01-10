'use client';

import { zAmount, zPaymentMint } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection } from '@solana/wallet-adapter-react';
import { ReactNode, useCallback, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { TransactionToast } from '../TransactionToast';
import { buildTx, SPLURGE_CLIENT } from '@/lib/client/solana';
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
import { useShopper } from '@/providers/ShopperProvider';
import { atomicToUsd, removeTrailingZeroes } from '@/lib/utils';
import { MAX_FEE_BASIS_POINTS } from '@solana/spl-token';
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
import { useSettings } from '@/providers/SettingsProvider';
import { ParsedConfig, ParsedItem, ParsedStore } from '@/types/accounts';
import { useItems } from '@/providers/ItemsProvider';

export function CheckoutDialog({
  item,
  store,
  config,
  btnVariant = 'default',
  btnSize = 'sm',
  children,
}: {
  item: ParsedItem;
  store: ParsedStore;
  config: ParsedConfig;
  btnVariant?: 'default' | 'secondary';
  btnSize?: 'sm' | 'icon';
  children: ReactNode;
}) {
  const { connection } = useConnection();
  const { publicKey } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { pythSolanaReceiver, getUpdatePriceFeedTx } = usePyth();
  const { itemsMutate } = useItems();
  const { shopperData } = useShopper();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const createOrderSchema = z.object({
    amount: zAmount.max(item.inventoryCount, 'Amount exceeds inventory count.'),
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

  const orderSubtotal = item.price * (amount || 0);

  const platformFee = Math.floor(
    (orderSubtotal * config.orderFeeBps) / MAX_FEE_BASIS_POINTS
  );

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

          if (config.isPaused) {
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
                connection,
                [
                  await SPLURGE_CLIENT.createOrderIx({
                    amount: data.amount,
                    authority: publicKey,
                    storePda: new PublicKey(store.publicKey),
                    itemPda: new PublicKey(item.publicKey),
                    priceUpdateV2: token.priceUpdateV2,
                    paymentMint: new PublicKey(data.paymentMint),
                    tokenProgram: token.owner,
                  }),
                ],
                publicKey,
                [],
                priorityFee
              ),
              signers: [],
            },
          ]);

          // checkout transaction is the last one
          await connection.confirmTransaction(
            signatures[signatures.length - 1]
          );

          return {
            signature: signatures[1],
            shopperData,
            paymentMintSymbol: token.symbol,
          };
        },
        {
          loading: 'Waiting for signature...',
          success: async ({ signature, shopperData, paymentMintSymbol }) => {
            const newInventoryCount = item.inventoryCount - data.amount;

            await itemsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error('Items should not be null.');
                }

                return prev.map((prevItem) => {
                  if (prevItem.publicKey === item.publicKey) {
                    return {
                      ...prevItem,
                      inventoryCount: newInventoryCount,
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

            closeAndReset();
            setIsSubmitting(false);

            await alertNewOrders({
              storeAuthority: store.authority,
              shopperName: shopperData.name,
              itemName: item.name,
              itemAmount: data.amount,
              shopperAddress: shopperData.address,
              paymentSubtotal: atomicToUsd(orderSubtotal),
              paymentMintSymbol,
            });

            if (newInventoryCount === 0) {
              await alertOutOfStock({
                itemName: item.name,
                storeAuthority: store.authority,
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
      shopperData,
      connection,
      pythSolanaReceiver,
      getUpdatePriceFeedTx,
      orderSubtotal,
      closeAndReset,
      getTransactionLink,
      priorityFee,
      item,
      store,
      config,
      itemsMutate,
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
            <LargeImage src={item.image} alt={item.name} />
            <h3 className="truncate text-base font-medium">{item.name}</h3>
            <div className="flex w-full flex-col gap-y-2">
              <div className="flex justify-between gap-x-2">
                <p className="text-sm">Price</p>
                <p className="text-sm">{atomicToUsd(item.price)} USD</p>
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
                          max={item.inventoryCount}
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
                <p className="text-sm">
                  {removeTrailingZeroes(
                    atomicToUsd(platformFee, MINT_DECIMALS)
                  )}{' '}
                  USD
                </p>
              </div>
              <div className="flex justify-between gap-x-2">
                <p className="text-sm">Subtotal</p>
                <p className="text-sm">{atomicToUsd(orderSubtotal)} USD</p>
              </div>
              <div className="flex justify-between gap-x-2">
                <p className="text-sm font-semibold">Total</p>
                <p className="text-sm font-semibold">
                  {removeTrailingZeroes(
                    atomicToUsd(orderSubtotal + platformFee, MINT_DECIMALS)
                  )}{' '}
                  USD
                </p>
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
