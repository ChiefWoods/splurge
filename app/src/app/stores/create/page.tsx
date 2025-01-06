'use client';

import { CreateSection } from '@/components/CreateSection';
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
import { Loader2, Store } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageInput } from '@/components/ImageInput';
import { useRouter } from 'next/navigation';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import useSWR from 'swr';
import { getStorePda } from '@/lib/pda';
import { TransactionToast } from '@/components/TransactionToast';
import {
  getDicebearFile,
  getTransactionLink,
  setComputeUnitLimitAndPrice,
} from '@/lib/utils';
import { toast } from 'sonner';
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { Spinner } from '@/components/Spinner';

export default function Page() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { getCreateStoreIx, getStoreAcc } = useAnchorProgram();
  const { upload } = useIrysUploader();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const store = useSWR(
    publicKey ? { url: '/api/stores/create', publicKey } : null,
    async ({ publicKey }) => {
      const pda = getStorePda(publicKey);
      const acc = await getStoreAcc(pda);

      if (acc) {
        router.replace(`/stores/${pda}`);
      }

      return { pda };
    }
  );

  const form = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: '',
      about: '',
    },
  });

  function onSubmit(data: CreateStoreFormData) {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsUploading(true);
        const imageUri = await upload(
          data.image ?? (await getDicebearFile('store', publicKey.toBase58()))
        );

        return { imageUri, publicKey };
      },
      {
        loading: 'Uploading image...',
        success: ({ imageUri, publicKey }) => {
          toast.promise(
            async () => {
              setIsSubmitting(true);
              const ix = await getCreateStoreIx(
                data.name,
                imageUri,
                data.about,
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
                setIsSubmitting(false);
                setIsOpen(false);
                form.reset();
                setImagePreview('');

                setTimeout(() => {
                  if (store.data) {
                    router.push(`/stores/${store.data.pda.toBase58()}`);
                  }
                }, 1000);

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
  }

  if (store.isLoading) {
    return <Spinner />;
  }

  return (
    <CreateSection header="Create your Store to start offering splurges!">
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
                    <Store className="h-4 w-4" />
                  )}
                  Create Store
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </CreateSection>
  );
}
