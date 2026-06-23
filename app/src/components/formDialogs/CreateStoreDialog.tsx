"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useConnection, useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { createInitializeStoreInstruction, findStorePda } from "@splurge/sdk";
import { Store } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormDialogTitle } from "@/components/FormDialogTitle";
import { ImageInput } from "@/components/ImageInput";
import { TransactionToast } from "@/components/TransactionToast";
import { Dialog, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WalletGuardButton } from "@/components/WalletGuardButton";
import { useIrysUploader } from "@/hooks/useIrysUploader";
import { sendTx } from "@/lib/api";
import { DicebearStyles, getDicebearFile } from "@/lib/client/dicebear";
import { buildTx } from "@/lib/client/solana";
import { CreateStoreFormData, createStoreSchema } from "@/lib/schema";
import { useSettings } from "@/providers/SettingsProvider";
import { useStore } from "@/providers/StoreProvider";

import { FormCancelButton } from "../FormCancelButton";
import { FormDialogContent } from "../FormDialogContent";
import { FormDialogFooter } from "../FormDialogFooter";
import { FormSubmitButton } from "../FormSubmitButton";
import { ImageInputLabel } from "../ImageInputLabel";

export function CreateStoreDialog() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { storeMutate } = useStore();
  const { upload } = useIrysUploader();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: "",
      about: "",
    },
  });

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    form.reset();
    setImagePreview("");
  }, [form]);

  const onSubmit = useCallback(
    (data: CreateStoreFormData) => {
      toast.promise(
        async () => {
          if (!publicKey || !signTransaction) {
            throw new Error("Wallet not connected.");
          }

          setIsUploading(true);
          const imageUri = await upload(
            data.image ?? (await getDicebearFile(DicebearStyles.Store, publicKey.toBase58())),
          );

          return { imageUri, publicKey, signTransaction };
        },
        {
          loading: "Uploading image...",
          success: ({ imageUri, publicKey, signTransaction }) => {
            toast.promise(
              async () => {
                setIsSubmitting(true);

                let tx = await buildTx(
                  connection,
                  [
                    createInitializeStoreInstruction(
                      { authority: publicKey },
                      {
                        name: data.name,
                        image: imageUri,
                        about: data.about,
                      },
                    ),
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
                  const [storeAddress, bump] = findStorePda({ authority: publicKey });
                  const newStore = {
                    address: storeAddress.toBase58(),
                    data: {
                      about: data.about,
                      authority: publicKey.toBase58(),
                      bump,
                      image: imageUri,
                      name: data.name,
                    },
                  };

                  await storeMutate(newStore, {
                    revalidate: false,
                  });

                  closeAndReset();
                  setImagePreview("");

                  return (
                    <TransactionToast
                      title="Store created! Redirecting..."
                      link={getTransactionLink(signature)}
                    />
                  );
                },
                error: (err) => {
                  console.error(err);
                  setIsSubmitting(false);
                  return err.message || "Something went wrong.";
                },
              },
            );

            setIsUploading(false);
            return "Image uploaded!";
          },
          error: (err) => {
            console.error(err);
            setIsUploading(false);
            return err.message || "Something went wrong.";
          },
        },
      );
    },
    [
      storeMutate,
      publicKey,
      signTransaction,
      upload,
      closeAndReset,
      connection,
      getTransactionLink,
      priorityFee,
    ],
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton setOpen={setIsOpen}>
          <Store />
          Create Store
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Create Store" />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <ImageInputLabel />
                  <FormControl>
                    <ImageInput
                      field={field}
                      imagePreview={imagePreview}
                      setImagePreview={setImagePreview}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About</FormLabel>
                  <FormControl>
                    <Input placeholder="About" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDialogFooter>
              <FormCancelButton onClick={closeAndReset} />
              <FormSubmitButton
                Icon={Store}
                disabled={isUploading || isSubmitting}
                text="Create Store"
              />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
