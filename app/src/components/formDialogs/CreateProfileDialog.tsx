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
import { CreateProfileFormData, createProfileSchema } from '@/lib/schema';
import { UserRound } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageInput } from '@/components/ImageInput';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import { toast } from 'sonner';
import { TransactionToast } from '@/components/TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/solana-client';
import { createShopperIx } from '@/lib/instructions';
import { DicebearStyles, getDicebearFile } from '@/lib/dicebear';
import { confirmTransaction } from '@solana-developers/helpers';
import { useShopper } from '@/providers/ShopperProvider';
import { getShopperPda } from '@/lib/pda';
import { ImageInputLabel } from '../ImageInputLabel';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '@/components/FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';

export function CreateProfileDialog() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useUnifiedWallet();
  const { shopperMutate } = useShopper();
  const { upload } = useIrysUploader();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(createProfileSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  });

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    form.reset();
    setImagePreview('');
  }, [form]);

  const onSubmit = useCallback(
    (data: CreateProfileFormData) => {
      toast.promise(
        async () => {
          if (!publicKey) {
            throw new Error('Wallet not connected.');
          }

          setIsUploading(true);
          const imageUri = await upload(
            data.image ??
              (await getDicebearFile(
                DicebearStyles.Shopper,
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
                    await createShopperIx({
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
                success: async (signature) => {
                  const newShopper = {
                    address: data.address,
                    authority: publicKey.toBase58(),
                    image: imageUri,
                    name: data.name,
                    publicKey: getShopperPda(publicKey).toBase58(),
                  };

                  await shopperMutate(newShopper, {
                    revalidate: false,
                  });

                  closeAndReset();
                  setIsSubmitting(false);

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
    },
    [
      connection,
      sendTransaction,
      shopperMutate,
      upload,
      publicKey,
      closeAndReset,
    ]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton setOpen={setIsOpen}>
          <UserRound />
          Create Profile
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Create Profile" />
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
            <FormDialogFooter>
              <FormCancelButton onClick={closeAndReset} />
              <FormSubmitButton
                Icon={UserRound}
                disabled={isUploading || isSubmitting}
                text="Create Profile"
              />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
