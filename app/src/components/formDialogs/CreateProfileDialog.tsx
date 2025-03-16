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
import { CreateProfileFormData, createProfileSchema } from '@/lib/schema';
import { Loader2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageInput } from '@/components/ImageInput';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { useRouter } from 'next/navigation';
import { SWRResponse, mutate } from 'swr';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import { toast } from 'sonner';
import { TransactionToast } from '@/components/TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/utils';
import { PublicKey } from '@solana/web3.js';
import { getCreateShopperIx } from '@/lib/instructions';
import { getDicebearFile } from '@/lib/api';
import { confirmTransaction } from '@solana-developers/helpers';
import { getShopperPda } from '@/lib/pda';

export function CreateProfileDialog() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { upload } = useIrysUploader();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  function onSubmit(data: CreateProfileFormData) {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsUploading(true);
        const imageUri = await upload(
          data.image ?? (await getDicebearFile('shopper', publicKey.toBase58()))
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
                  await getCreateShopperIx({
                    name: data.name,
                    image: imageUri,
                    address: data.address,
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
              success: (signature) => {
                setIsSubmitting(false);
                setIsOpen(false);
                form.reset();
                setImagePreview('');

                setTimeout(() => {
                  router.push(
                    `/shoppers/${getShopperPda(publicKey).toBase58()}`
                  );
                }, 1000);

                return (
                  <TransactionToast
                    title="Profile created! Redirecting..."
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
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton setOpen={setIsOpen}>
          <UserRound />
          Create Profile
        </WalletGuardButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Create Profile
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
                  <FormLabel>Image</FormLabel>
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-end gap-4">
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
                {isUploading || isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <UserRound className="h-4 w-4" />
                )}
                Create Profile
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
