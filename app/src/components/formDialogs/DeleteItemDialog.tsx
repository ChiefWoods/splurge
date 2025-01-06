'use client';

import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getTransactionLink, setComputeUnitLimitAndPrice } from '@/lib/utils';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { TransactionToast } from '../TransactionToast';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { WalletGuardButton } from '../WalletGuardButton';

export function DeleteItemDialog({
  name,
  mutate,
}: {
  name: string;
  mutate: () => void;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { getDeleteItemIx } = useAnchorProgram();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    toast.promise(
      async () => {
        if (!publicKey) {
          throw new Error('Wallet not connected.');
        }

        setIsSubmitting(true);
        const ix = await getDeleteItemIx(name, publicKey);
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
          setIsSubmitting(false);
          setIsOpen(false);

          return (
            <TransactionToast
              title="Item deleted!"
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
        <WalletGuardButton variant="outline" size={'icon'} setOpen={setIsOpen}>
          <Trash2 />
        </WalletGuardButton>
      </DialogTrigger>
      <DialogContent className="flex max-h-[500px] flex-col overflow-scroll sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-start text-xl font-semibold">
            Delete Item
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {name}? Warning: reviews will be
            lost forever!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={'destructive'}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
