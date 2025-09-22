'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useConnection } from '@solana/wallet-adapter-react';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import { TransactionToast } from '@/components/TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/solana-client';
import { toast } from 'sonner';
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { createStoreIx } from '@/lib/instructions';
import { confirmTransaction } from '@solana-developers/helpers';
import { DicebearStyles, getDicebearFile } from '@/lib/dicebear';
import { usePersonalStore } from '@/providers/PersonalStoreProvider';
import { getStorePda } from '@/lib/pda';
import { ImageInputLabel } from '../ImageInputLabel';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';

export function CreateStoreDialog() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useUnifiedWallet();
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

  const onSubmit = useCallback(
    (data: CreateStoreFormData) => {
      toast.promise(
        async () => {
          if (!publicKey) {
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

          return { imageUri, publicKey };
        },
        {
          loading: 'Uploading image...',
          success: ({ imageUri, publicKey }) => {
            toast.promise(
              async () => {
                setIsSubmitting(true);

                const tx = await buildTx(
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

                const signature = await sendTransaction(tx, connection);

                await confirmTransaction(connection, signature);

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

                  setIsOpen(false);
                  setIsSubmitting(false);
                  setImagePreview('');
                  form.reset();

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
                  return err.message;
                },
              }
            );

            setIsUploading(false);
            return 'Image uploaded!';
          },
          error: (err) => {
            console.error(err);
            setIsUploading(false);
            return err.message;
          },
        }
      );
    },
    [connection, form, personalStoreMutate, publicKey, sendTransaction, upload]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton setOpen={setIsOpen}>
          <Store />
          Create Store
        </WalletGuardButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Create Store
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                  setImagePreview('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || isSubmitting}>
                <Store className="h-4 w-4" />
                Create Store
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
