'use client';

import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { zAmount, zPaymentMint } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TransactionToast } from '../TransactionToast';
import { getTransactionLink, setComputeUnitLimitAndPrice } from '@/lib/utils';
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
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { z } from 'zod';

export function CheckoutDialog({
  name,
  image,
  price,
  maxAmount,
  storePda,
  storeItemPda,
  btnVariant = 'secondary',
  btnSize = 'sm',
  mutate,
  children,
}: {
  name: string;
  image: string;
  price: number;
  maxAmount: number;
  storePda: string;
  storeItemPda: string;
  btnVariant?: 'default' | 'secondary';
  btnSize?: 'sm' | 'icon';
  mutate: () => void;
  children: ReactNode;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { getCreateOrderIx } = useAnchorProgram();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderTotal, setOrderTotal] = useState<number>(0);

  // Hardcoded because devnet USDC has no metadata to fetch
  const whitelistedPaymentTokens = [
    {
      mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
      name: 'USDC',
      image: '/whitelisted_mint/usdc.png',
      symbol: 'USDC',
      owner: TOKEN_PROGRAM_ID,
    },
    {
      mint: 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
      name: 'Paypal USD',
      image: '/whitelisted_mint/pyusd.png',
      symbol: 'PYUSD',
      owner: TOKEN_2022_PROGRAM_ID,
    },
  ];

  // Dynamic schema
  const createOrderSchema = z.object({
    amount: zAmount.max(maxAmount, 'Amount exceeds inventory count.'),
    paymentMint: zPaymentMint,
  });

  type CreateOrderFormData = z.infer<typeof createOrderSchema>;

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      amount: 1,
      paymentMint: whitelistedPaymentTokens[0].mint,
    },
  });

  function onSubmit(data: CreateOrderFormData) {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsSubmitting(true);

        const token = whitelistedPaymentTokens.find(
          ({ mint }) => mint === data.paymentMint
        );

        if (!token) {
          throw new Error('Payment mint not whitelisted.');
        }

        const ix = await getCreateOrderIx(
          Date.now(),
          data.amount,
          data.amount * price,
          new PublicKey(storePda),
          new PublicKey(storeItemPda),
          new PublicKey(data.paymentMint),
          token.owner,
          publicKey
        );
        const tx = await setComputeUnitLimitAndPrice(
          connection,
          [ix],
          publicKey,
          []
        );
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;

        const signature = await sendTransaction(tx, connection);

        await connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature,
        });

        return signature;
      },
      {
        loading: 'Waiting for signature...',
        success: (signature) => {
          mutate();
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
                <p>{price} USD</p>
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
                          min={0}
                          max={maxAmount}
                          step={1}
                          onChange={(e) => {
                            field.onChange(e);
                            setOrderTotal(Number(e.target.value) * price);
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
                          {whitelistedPaymentTokens.map(
                            ({ mint, name, image, symbol }) => (
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
              <p className="font-semibold">{orderTotal.toFixed(2)} USD</p>
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
