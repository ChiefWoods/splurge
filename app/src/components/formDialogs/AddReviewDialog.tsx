'use client';

import { CreateReviewFormData, createReviewSchema } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TransactionToast } from '../TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/solana-helpers';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { WalletGuardButton } from '../WalletGuardButton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import { createReviewIx } from '@/lib/instructions';
import { getReviewPda, getShopperPda } from '@/lib/pda';
import { confirmTransaction } from '@solana-developers/helpers';
import { useReview } from '@/providers/ReviewProvider';

export function AddReviewDialog({
  itemPda,
  orderPda,
}: {
  itemPda: string;
  orderPda: string;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { allReviews } = useReview();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateReviewFormData>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      rating: 3,
      text: '',
    },
  });

  function onSubmit(data: CreateReviewFormData) {
    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsSubmitting(true);

        const tx = await buildTx(
          [
            await createReviewIx({
              text: data.text,
              rating: data.rating,
              authority: publicKey,
              shopperPda: getShopperPda(publicKey),
              orderPda: new PublicKey(orderPda),
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
          await allReviews.trigger(
            { itemPda },
            {
              optimisticData: (prev) => {
                if (prev) {
                  return [
                    ...prev,
                    {
                      publicKey: getReviewPda(
                        new PublicKey(orderPda)
                      ).toBase58(),
                      order: orderPda,
                      rating: data.rating,
                      timestamp: Date.now() / 1000,
                      text: data.text,
                    },
                  ];
                } else {
                  return [];
                }
              },
            }
          );
          form.reset();
          setIsSubmitting(false);
          setIsOpen(false);

          return (
            <TransactionToast
              title="Review added!"
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
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton variant="default" size={'sm'} setOpen={setIsOpen}>
          <Plus />
          Add Review
        </WalletGuardButton>
      </DialogTrigger>
      <DialogContent className="max-h-[500px] overflow-scroll sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Add Review
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm">1</span>
                      <Slider
                        className="cursor-pointer"
                        min={1}
                        max={5}
                        step={1}
                        ref={field.ref}
                        name={field.name}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        onBlur={field.onBlur}
                      />
                      <span className="text-sm">5</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share something about the product..."
                      className="resize-none"
                      {...field}
                    />
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
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="h-4 w-4" />
                Add Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
