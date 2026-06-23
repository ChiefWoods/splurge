"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { PublicKey } from "@solana/web3.js";
import { createUpdateItemInstruction } from "@splurge/sdk";
import { Pencil } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { sendTx } from "@/lib/api";
import { buildTx } from "@/lib/client/solana";
import { MINT_DECIMALS } from "@/lib/constants";
import { UpdateItemFormData, updateItemSchema } from "@/lib/schema";
import { useItems } from "@/providers/ItemsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { ParsedItem } from "@/types/accounts";

import { FormCancelButton } from "../FormCancelButton";
import { FormDialogContent } from "../FormDialogContent";
import { FormDialogFooter } from "../FormDialogFooter";
import { FormDialogTitle } from "../FormDialogTitle";
import { FormSubmitButton } from "../FormSubmitButton";
import { TransactionToast } from "../TransactionToast";
import { Dialog, DialogHeader, DialogTrigger } from "../ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { WalletGuardButton } from "../WalletGuardButton";

export function UpdateItemDialog({ item, storePda }: { item: ParsedItem; storePda: string }) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { itemsMutate } = useItems();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateItemFormData>({
    resolver: zodResolver(updateItemSchema),
    defaultValues: {
      inventoryCount: item.data.inventoryCount,
      price: Number(item.data.price),
    },
  });

  const onSubmit = useCallback(
    (data: UpdateItemFormData) => {
      toast.promise(
        async () => {
          if (!publicKey || !signTransaction) {
            throw new Error("Wallet not connected.");
          }

          setIsSubmitting(true);

          let tx = await buildTx(
            connection,
            [
              createUpdateItemInstruction(
                {
                  authority: publicKey,
                  item: new PublicKey(item.address),
                  store: new PublicKey(storePda),
                },
                {
                  price: BigInt(Math.round(data.price)),
                  inventoryCount: data.inventoryCount,
                },
              ),
            ],
            publicKey,
            [],
            priorityFee,
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
          loading: "Waiting for signature...",
          success: async ({ signature, inventoryCount, price }) => {
            await itemsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error("Items should not be null.");
                }

                return prev.map((prevItem) => {
                  if (prevItem.address === item.address) {
                    return {
                      ...prevItem,
                      data: {
                        ...prevItem.data,
                        price: price.toFixed(2),
                        inventoryCount,
                      },
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

            setIsOpen(false);
            form.reset({
              inventoryCount,
              price,
            });
            setIsSubmitting(false);

            return <TransactionToast title="Item updated!" link={getTransactionLink(signature)} />;
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
      itemsMutate,
      form,
      item,
      publicKey,
      signTransaction,
      storePda,
      connection,
      getTransactionLink,
      priorityFee,
    ],
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton variant="outline" size={"icon"} setOpen={setIsOpen}>
          <Pencil />
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Update Item" />
        </DialogHeader>
        <section className="flex items-start gap-x-4">
          <Image
            src={item.data.image}
            alt={item.data.name}
            width={100}
            height={100}
            className="aspect-square rounded-lg border"
            priority
          />
          <div className="flex flex-1 flex-col gap-y-1">
            <p className="truncate text-lg font-semibold">{item.data.name}</p>
            <p className="text-sm text-wrap">{item.data.description}</p>
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
                          isNaN(usdValue) ? 0 : Number(usdValue.toFixed(2)) * 10 ** MINT_DECIMALS,
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
              <FormSubmitButton Icon={Pencil} disabled={isSubmitting} text="Update Item" />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
