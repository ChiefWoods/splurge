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
import { CreateProfileFormData, createProfileSchema } from '@/lib/schema';
import { Loader2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageInput } from '@/components/ImageInput';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletGuardButton } from '@/components/WalletGuardButton';
import { useRouter } from 'next/navigation';
import { getShopperPda } from '@/lib/pda';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import useSWR from 'swr';
import { useIrysUploader } from '@/hooks/useIrysUploader';
import { toast } from 'sonner';
import { TransactionToast } from '@/components/TransactionToast';
import {
  getDicebearFile,
  getTransactionLink,
  setComputeUnitLimitAndPrice,
} from '@/lib/utils';
import { Spinner } from '@/components/Spinner';

export default function Page() {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { getCreateShopperIx, getShopperAcc } = useAnchorProgram();
  const { upload } = useIrysUploader();
  const [isOpen, setIsOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shopper = useSWR(
    publicKey ? { url: '/api/shoppers/create', publicKey } : null,
    async ({ publicKey }) => {
      const pda = getShopperPda(publicKey);
      const acc = await getShopperAcc(pda);

      if (acc) {
        router.replace(`/shoppers/${pda}`);
      }

      return { pda };
    }
  );

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
              const ix = await getCreateShopperIx(
                data.name,
                imageUri,
                data.address,
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
                  if (shopper.data) {
                    router.push(`/shoppers/${shopper.data.pda.toBase58()}`);
                  }
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

  if (shopper.isLoading) {
    return <Spinner />;
  }

  return (
    <CreateSection header="Create your Shopper profile to start splurging!">
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
    </CreateSection>
  );
}
