"use client";

import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { PublicKey } from "@solana/web3.js";
import { createUnlistItemInstruction } from "@splurge/sdk";
import { Trash2 } from "lucide-react";
import { FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";

import { FormDialogTitle } from "@/components/FormDialogTitle";
import { sendTx } from "@/lib/api";
import { buildTx } from "@/lib/client/solana";
import { useItems } from "@/providers/ItemsProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { ParsedItem } from "@/types/accounts";

import { FormCancelButton } from "../FormCancelButton";
import { FormDialogContent } from "../FormDialogContent";
import { FormDialogFooter } from "../FormDialogFooter";
import { FormSubmitButton } from "../FormSubmitButton";
import { TransactionToast } from "../TransactionToast";
import { Dialog, DialogDescription, DialogHeader, DialogTrigger } from "../ui/dialog";
import { WalletGuardButton } from "../WalletGuardButton";

export function DeleteItemDialog({ item, storePda }: { item: ParsedItem; storePda: string }) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { itemsMutate } = useItems();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      toast.promise(
        async () => {
          if (!publicKey || !signTransaction) {
            throw new Error("Wallet not connected.");
          }

          setIsSubmitting(true);

          let tx = await buildTx(
            connection,
            [
              createUnlistItemInstruction({
                authority: publicKey,
                item: new PublicKey(item.address),
                store: new PublicKey(storePda),
              }),
            ],
            publicKey,
            [],
            priorityFee,
          );

          tx = await signTransaction(tx);
          const signature = await sendTx(tx);

          return signature;
        },
        {
          loading: "Waiting for signature...",
          success: async (signature) => {
            await itemsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error("Items should not be null.");
                }

                return prev.filter((prevItem) => {
                  return prevItem.address !== item.address;
                });
              },
              {
                revalidate: true,
              },
            );

            setIsOpen(false);
            setIsSubmitting(false);

            return <TransactionToast title="Item deleted!" link={getTransactionLink(signature)} />;
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
          <Trash2 />
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Delete Item" />
          <DialogDescription className="text-foreground">
            Are you sure you want to delete {item.data.name}? Warning: reviews will be lost forever!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <FormDialogFooter>
            <FormCancelButton onClick={() => setIsOpen(false)} />
            <FormSubmitButton
              Icon={Trash2}
              text="Delete Item"
              disabled={isSubmitting}
              variant="destructive"
              className="text-foreground"
            />
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
