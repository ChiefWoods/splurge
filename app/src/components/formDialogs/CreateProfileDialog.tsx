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
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import { toast } from 'sonner';
import { TransactionToast } from '@/components/TransactionToast';
import { buildTx } from '@/lib/client/solana';
import { DicebearStyles, getDicebearFile } from '@/lib/client/dicebear';
import { useShopper } from '@/providers/ShopperProvider';
import { ImageInputLabel } from '../ImageInputLabel';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '@/components/FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';
import { sendTx } from '@/lib/api';
import { useProgram } from '@/providers/ProgramProvider';
import { useSettings } from '@/providers/SettingsProvider';

export function CreateProfileDialog() {
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { splurgeClient } = useProgram();
  const { getTransactionLink } = useSettings();
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
          if (!publicKey || !signTransaction) {
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

          return { imageUri, publicKey, signTransaction };
        },
        {
          loading: 'Uploading image...',
          success: ({ imageUri, publicKey, signTransaction }) => {
            toast.promise(
              async () => {
                setIsSubmitting(true);

                let tx = await buildTx(
                  splurgeClient.connection,
                  [
                    await splurgeClient.createShopperIx({
                      name: data.name,
                      image: imageUri,
                      address: data.address,
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
                  const newShopper = {
                    address: data.address,
                    authority: publicKey.toBase58(),
                    image: imageUri,
                    name: data.name,
                    publicKey: splurgeClient
                      .getShopperPda(publicKey)
                      .toBase58(),
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
    [
      signTransaction,
      shopperMutate,
      upload,
      publicKey,
      closeAndReset,
      splurgeClient,
      getTransactionLink,
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
