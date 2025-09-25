'use client';

import { CreateReviewFormData, createReviewSchema } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TransactionToast } from '../TransactionToast';
import { buildTx, getTransactionLink } from '@/lib/solana-client';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import { Plus } from 'lucide-react';
import { Dialog, DialogHeader, DialogTrigger } from '../ui/dialog';
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
import { useReviews } from '@/providers/ReviewsProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '@/components/FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';

export function AddReviewDialog({ orderPda }: { orderPda: string }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useUnifiedWallet();
  const { reviewsMutate } = useReviews();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateReviewFormData>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      rating: 3,
      text: '',
    },
  });

  const closeAndReset = useCallback(() => {
    setIsOpen(false);
    form.reset();
  }, [form]);

  const onSubmit = useCallback(
    (data: CreateReviewFormData) => {
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
            const newReview = {
              publicKey: getReviewPda(new PublicKey(orderPda)).toBase58(),
              order: orderPda,
              rating: data.rating,
              timestamp: Date.now() / 1000,
              text: data.text,
            };

            await reviewsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error('Reviews should not be null.');
                }

                return [...prev, newReview];
              },
              {
                revalidate: false,
              }
            );

            closeAndReset();
            setIsSubmitting(false);

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
    },
    [
      reviewsMutate,
      connection,
      orderPda,
      publicKey,
      sendTransaction,
      closeAndReset,
    ]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton variant="secondary" size={'sm'} setOpen={setIsOpen}>
          <Plus />
          Add Review
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Add Review" />
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
            <FormDialogFooter>
              <FormCancelButton onClick={closeAndReset} />
              <FormSubmitButton
                Icon={Plus}
                disabled={isSubmitting}
                text="Add Review"
              />
            </FormDialogFooter>
          </form>
        </Form>
      </FormDialogContent>
    </Dialog>
  );
}
