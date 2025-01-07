'use client';

import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { CreateReviewFormData, createReviewSchema } from '@/lib/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TransactionToast } from '../TransactionToast';
import { getTransactionLink, setComputeUnitLimitAndPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { PublicKey } from '@solana/web3.js';
import { Button } from '../ui/button';
import { Loader2, Plus } from 'lucide-react';
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

export function AddReviewDialog({
  storeItemPda,
  orderPda,
  mutate,
}: {
  storeItemPda: string;
  orderPda: string;
  mutate: () => void;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { getCreateReviewIx } = useAnchorProgram();
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
        const ix = await getCreateReviewIx(
          data.text,
          data.rating,
          publicKey,
          new PublicKey(storeItemPda),
          new PublicKey(orderPda)
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
        <WalletGuardButton variant="secondary" size={'sm'} setOpen={setIsOpen}>
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
            <DialogFooter className="flex justify-end gap-4">
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
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Review
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
