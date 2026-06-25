"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { MAX_FEE_BASIS_POINTS } from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { createCreateOrderInstruction, findOrderPda, findShopperPda } from "@splurge/sdk";
import { Package } from "lucide-react";
import { ReactNode, useCallback, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormDialogTitle } from "@/components/FormDialogTitle";
import { buildTx } from "@/lib/client/solana";
import { ACCEPTED_MINTS_METADATA } from "@/lib/constants";
import { MINT_DECIMALS } from "@/lib/constants";
import { zAmount, zPaymentMint } from "@/lib/schema";
import { alertNewOrders, alertOutOfStock } from "@/lib/server/dialect";
import { atomicToUsd, removeTrailingZeroes } from "@/lib/utils";
import { useItems } from "@/providers/ItemsProvider";
import { usePyth } from "@/providers/PythProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useShopper } from "@/providers/ShopperProvider";
import { ParsedConfig, ParsedItem, ParsedStore } from "@/types/accounts";

import { FormCancelButton } from "../FormCancelButton";
import { FormDialogContent } from "../FormDialogContent";
import { FormDialogFooter } from "../FormDialogFooter";
import { FormSubmitButton } from "../FormSubmitButton";
import { LargeImage } from "../LargeImage";
import { MintIcon } from "../MintIcon";
import { TransactionToast } from "../TransactionToast";
import { Dialog, DialogHeader, DialogTrigger } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { WalletGuardButton } from "../WalletGuardButton";

export function CheckoutDialog({
  item,
  store,
  config,
  btnVariant = "default",
  btnSize = "sm",
  children,
}: {
  item: ParsedItem;
  store: ParsedStore;
  config: ParsedConfig;
  btnVariant?: "default" | "secondary";
  btnSize?: "sm" | "icon";
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
    amount: zAmount.max(item.data.inventoryCount, "Amount exceeds inventory count."),
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
    name: "amount",
  });

  const orderSubtotal = BigInt(item.data.price) * BigInt(amount || 0);

  const platformFee =
    (orderSubtotal * BigInt(config.data.orderFeeBps)) / BigInt(MAX_FEE_BASIS_POINTS);

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    form.reset();
  }, [form]);

  const onSubmit = useCallback(
    (data: CreateOrderFormData) => {
      toast.promise(
        async () => {
          if (!publicKey) {
            throw new Error("Wallet not connected.");
          }

          if (!pythSolanaReceiver) {
            throw new Error("Pyth Solana Receiver not initialized");
          }

          if (!shopperData) {
            throw new Error("Shopper account not created.");
          }

          if (config.data.isPaused) {
            throw new Error("Platform is currently paused. No new orders can be created.");
          }

          setIsSubmitting(true);

          const token = ACCEPTED_MINTS_METADATA.get(data.paymentMint);

          if (!token) {
            throw new Error("Payment mint not found.");
          }

          const timestamp = BigInt(Math.floor(Date.now() / 1000 - 1));
          const itemPda = new PublicKey(item.address);
          const shopper = findShopperPda({ authority: publicKey })[0];
          const order = findOrderPda({ shopper, item: itemPda, timestamp })[0];
          const orderInstruction = createCreateOrderInstruction(
            {
              authority: publicKey,
              store: new PublicKey(store.address),
              item: itemPda,
              order,
              priceUpdateV2: token.priceUpdateV2,
              paymentMint: new PublicKey(data.paymentMint),
              tokenProgram: token.owner,
            },
            { amount: data.amount, timestamp },
          );

          const signatures = await pythSolanaReceiver.provider.sendAll([
            ...(await getUpdatePriceFeedTx(token.id)),
            {
              tx: await buildTx(connection, [orderInstruction], publicKey, [], priorityFee),
              signers: [],
            },
          ]);

          // checkout transaction is the last one
          await connection.confirmTransaction(signatures[signatures.length - 1]);

          return {
            signature: signatures[1],
            shopperData,
            paymentMintSymbol: token.symbol,
          };
        },
        {
          loading: "Waiting for signature...",
          success: async ({ signature, shopperData, paymentMintSymbol }) => {
            const newInventoryCount = item.data.inventoryCount - data.amount;

            await itemsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error("Items should not be null.");
                }

                return prev.map((prevItem) => {
                  if (prevItem.address === item.address) {
                    return {
                      ...prevItem,
                      data: { ...prevItem.data, inventoryCount: newInventoryCount },
                    };
                  } else {
                    return prevItem;
                  }
                });
              },
              {
                revalidate: true,
              },
            );

            closeAndReset();
            setIsSubmitting(false);

            await alertNewOrders({
              storeAuthority: store.data.authority,
              shopperName: shopperData.data.name,
              itemName: item.data.name,
              itemAmount: data.amount,
              shopperAddress: shopperData.data.address,
              paymentSubtotal: atomicToUsd(orderSubtotal),
              paymentMintSymbol,
            });

            if (newInventoryCount === 0) {
              await alertOutOfStock({
                itemName: item.data.name,
                storeAuthority: store.data.authority,
              });
            }

            return <TransactionToast title="Order created!" link={getTransactionLink(signature)} />;
          },
          error: (err) => {
            console.error(err);
            setIsSubmitting(false);
            return err.message || "Something went wrong.";
          },
        },
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
    ],
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton variant={btnVariant} size={btnSize} setOpen={setIsOpen}>
          {children}
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Checkout" />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <LargeImage src={item.data.image} alt={item.data.name} />
            <h3 className="truncate text-base font-medium">{item.data.name}</h3>
            <div className="flex w-full flex-col gap-y-2">
              <div className="flex justify-between gap-x-2">
                <p className="text-sm">Price</p>
                <p className="text-sm">{atomicToUsd(item.data.price)} USD</p>
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
                          max={item.data.inventoryCount}
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment token" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Accepted mints should be obtained from config account, but hardcoded here due to devnet constraints */}
                          {Array.from(ACCEPTED_MINTS_METADATA.entries()).map(
                            ([mint, { name, image, symbol }]) => (
                              <SelectItem key={mint} value={mint} className="cursor-pointer">
                                <div className="flex items-center justify-start gap-x-2">
                                  <MintIcon src={image} alt={name} />
                                  <p className="text-sm">{symbol}</p>
                                </div>
                              </SelectItem>
                            ),
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
                  {removeTrailingZeroes(atomicToUsd(platformFee, MINT_DECIMALS))} USD
                </p>
              </div>
              <div className="flex justify-between gap-x-2">
                <p className="text-sm">Subtotal</p>
                <p className="text-sm">{atomicToUsd(orderSubtotal)} USD</p>
              </div>
              <div className="flex justify-between gap-x-2">
                <p className="text-sm font-semibold">Total</p>
                <p className="text-sm font-semibold">
                  {removeTrailingZeroes(atomicToUsd(orderSubtotal + platformFee, MINT_DECIMALS))}{" "}
                  USD
                </p>
              </div>
            </div>
            <FormDialogFooter>
              <FormCancelButton onClick={closeAndReset} />
              <FormSubmitButton Icon={Package} disabled={isSubmitting} text="Place Order" />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
