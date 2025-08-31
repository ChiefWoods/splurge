'use client';

import { buildTx, getTransactionLink } from '@/lib/solana-helpers';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { FormEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { TransactionToast } from '../TransactionToast';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { WalletGuardButton } from '../WalletGuardButton';
import { useItem } from '@/providers/ItemProvider';
import { unlistItemIx } from '@/lib/instructions';
import { PublicKey } from '@solana/web3.js';
import { confirmTransaction } from '@solana-developers/helpers';

export function DeleteItemDialog({
  name,
  itemPda,
  storePda,
}: {
  name: string;
  itemPda: string;
  storePda: string;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { allItemsTrigger } = useItem();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      toast.promise(
        async () => {
          if (!publicKey) {
            throw new Error('Wallet not connected.');
          }

          setIsSubmitting(true);

          const tx = await buildTx(
            [
              await unlistItemIx({
                authority: publicKey,
                itemPda: new PublicKey(itemPda),
                storePda: new PublicKey(storePda),
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
            await allItemsTrigger(
              { storePda },
              {
                optimisticData: (prev) => {
                  if (prev) {
                    return prev.filter((item) => {
                      return item.publicKey !== itemPda;
                    });
                  } else {
                    return [];
                  }
                },
              }
            );
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
    },
    [allItemsTrigger, connection, itemPda, publicKey, sendTransaction, storePda]
  );

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
          <DialogFooter className="flex justify-end gap-2">
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
              <Trash2 className="h-4 w-4" />
              Delete Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
