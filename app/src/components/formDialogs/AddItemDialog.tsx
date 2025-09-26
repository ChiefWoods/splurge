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
import { CreateItemFormData, createItemSchema } from '@/lib/schema';
import { Plus } from 'lucide-react';
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
import { Textarea } from '../ui/textarea';
import { DicebearStyles, getDicebearFile } from '@/lib/dicebear';
import { listItemIx } from '@/lib/instructions';
import { confirmTransaction } from '@solana-developers/helpers';
import { useItems } from '@/providers/ItemsProvider';
import { getItemPda } from '@/lib/pda';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { ImageInputLabel } from '../ImageInputLabel';
import { MINT_DECIMALS } from '@/lib/constants';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '@/components/FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';

export function AddItemDialog({ storePda }: { storePda: string }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useUnifiedWallet();
  const { upload } = useIrysUploader();
  const { itemsMutate } = useItems();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateItemFormData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      description: '',
      inventoryCount: 0,
      price: 1.0,
    },
  });

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    form.reset();
    setImagePreview('');
  }, [form]);

  const onSubmit = useCallback(
    (data: CreateItemFormData) => {
      toast.promise(
        async () => {
          if (!publicKey) {
            throw new Error('Wallet not connected.');
          }

          setIsUploading(true);
          const imageUri = await upload(
            data.image ??
              (await getDicebearFile(
                DicebearStyles.Item,
                publicKey.toBase58() + new Date().toString()
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
                    await listItemIx({
                      price: new BN(data.price * 10 ** MINT_DECIMALS),
                      inventoryCount: data.inventoryCount,
                      name: data.name,
                      image: imageUri,
                      description: data.description,
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
                  const newItem = {
                    publicKey: getItemPda(
                      new PublicKey(storePda),
                      data.name
                    ).toBase58(),
                    store: storePda,
                    price: data.price * 10 ** MINT_DECIMALS,
                    inventoryCount: data.inventoryCount,
                    name: data.name,
                    image: imageUri,
                    description: data.description,
                  };

                  await itemsMutate(
                    (prev) => {
                      if (!prev) {
                        throw new Error('Items should not be null.');
                      }

                      return [...prev, newItem];
                    },
                    {
                      revalidate: false,
                    }
                  );

                  closeAndReset();
                  setIsSubmitting(false);

                  return (
                    <TransactionToast
                      title="Item added!"
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
      upload,
      publicKey,
      connection,
      sendTransaction,
      itemsMutate,
      storePda,
      closeAndReset,
    ]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton size={'sm'} setOpen={setIsOpen}>
          <Plus />
          Add Item
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Add Item" />
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                      value={field.value.toString()}
                      min={1}
                      step={0.01}
                      onChange={(e) => {
                        const usdValue = parseFloat(e.target.value);
                        field.onChange(
                          isNaN(usdValue) ? 0 : Number(usdValue.toFixed(2))
                        );
                      }}
                      onBlur={() => {
                        const roundedUsdValue = Number(field.value.toFixed(2));
                        field.onChange(roundedUsdValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormDialogFooter>
              <FormCancelButton onClick={closeAndReset} />
              <FormSubmitButton
                Icon={Plus}
                disabled={isUploading || isSubmitting}
                text="Add Item"
              />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
