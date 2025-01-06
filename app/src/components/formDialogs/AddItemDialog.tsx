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
import { CreateItemFormData, createItemSchema } from '@/lib/schema';
import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageInput } from '@/components/ImageInput';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import { toast } from 'sonner';
import { TransactionToast } from '@/components/TransactionToast';
import {
  getDicebearFile,
  getTransactionLink,
  setComputeUnitLimitAndPrice,
} from '@/lib/utils';
import { Textarea } from '../ui/textarea';

export function AddItemDialog({ mutate }: { mutate: () => void }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { getCreateItemIx } = useAnchorProgram();
  const { upload } = useIrysUploader();
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

  function onSubmit(data: CreateItemFormData) {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsUploading(true);
        const imageUri = await upload(
          data.image ??
            (await getDicebearFile(
              'item',
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
              const ix = await getCreateItemIx(
                data.name,
                imageUri,
                data.description,
                data.inventoryCount,
                data.price,
                publicKey
              );
              const tx = await setComputeUnitLimitAndPrice(
                connection,
                [ix],
                publicKey,
                []
              );
              const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash();

              tx.recentBlockhash = blockhash;
              tx.lastValidBlockHeight = lastValidBlockHeight;

              const signature = await sendTransaction(tx, connection);

              await connection.confirmTransaction({
                blockhash,
                lastValidBlockHeight,
                signature,
              });

              return signature;
            },
            {
              loading: 'Waiting for signature...',
              success: (signature) => {
                mutate();
                form.reset();
                setIsSubmitting(false);
                setIsOpen(false);
                setImagePreview('');

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
        <WalletGuardButton variant="secondary" size={'sm'} setOpen={setIsOpen}>
          <Plus />
          Add Item
        </WalletGuardButton>
      </DialogTrigger>
      <DialogContent className="max-h-[500px] overflow-scroll sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Add Item
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
                      min={0}
                      step={1}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      onBlur={() => {
                        field.onChange(parseInt(field.value.toFixed(0)));
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
                      min={1}
                      step={0.01}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      onBlur={() => {
                        field.onChange(parseFloat(field.value.toFixed(2)));
                      }}
                    />
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
                  <Plus className="h-4 w-4" />
                )}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
