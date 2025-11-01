'use client';

import { Dialog, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreateStoreFormData, createStoreSchema } from '@/lib/schema';
import { Store } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageInput } from '@/components/ImageInput';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import { TransactionToast } from '@/components/TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/client/solana';
import { toast } from 'sonner';
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { createStoreIx } from '@/lib/instructions';
import { DicebearStyles, getDicebearFile } from '@/lib/client/dicebear';
import { usePersonalStore } from '@/providers/PersonalStoreProvider';
import { getStorePda } from '@/lib/pda';
import { ImageInputLabel } from '../ImageInputLabel';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '@/components/FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';
import { sendTx } from '@/lib/api';

export function CreateStoreDialog() {
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { personalStoreMutate } = usePersonalStore();
  const { upload } = useIrysUploader();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: '',
      about: '',
    },
  });

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    form.reset();
    setImagePreview('');
  }, [form]);

  const onSubmit = useCallback(
    (data: CreateStoreFormData) => {
      toast.promise(
        async () => {
          if (!publicKey || !signTransaction) {
            throw new Error('Wallet not connected.');
          }

          setIsUploading(true);
          const imageUri = await upload(
            data.image ??
              (await getDicebearFile(
                DicebearStyles.Store,
                publicKey.toBase58()
              ))
          );

          return { imageUri, publicKey, signTransaction };
        },
        {
          loading: 'Uploading image...',
          success: ({ imageUri, publicKey, signTransaction }) => {
            toast.promise(
              async () => {
                setIsSubmitting(true);

                let tx = await buildTx(
                  [
                    await createStoreIx({
                      name: data.name,
                      image: imageUri,
                      about: data.about,
                      authority: publicKey,
                    }),
                  ],
                  publicKey
                );

                tx = await signTransaction(tx);
                const signature = await sendTx(tx);

                return signature;
              },
              {
                loading: 'Waiting for signature...',
                success: async (signature) => {
                  const newStore = {
                    about: data.about,
                    authority: publicKey.toBase58(),
                    image: imageUri,
                    name: data.name,
                    publicKey: getStorePda(publicKey).toBase58(),
                  };

                  await personalStoreMutate(newStore, {
                    revalidate: false,
                  });

                  closeAndReset();
                  setImagePreview('');

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
                  return err.message || 'Something went wrong.';
                },
              }
            );

            setIsUploading(false);
            return 'Image uploaded!';
          },
          error: (err) => {
            console.error(err);
            setIsUploading(false);
            return err.message || 'Something went wrong.';
          },
        }
      );
    },
    [personalStoreMutate, publicKey, signTransaction, upload, closeAndReset]
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
