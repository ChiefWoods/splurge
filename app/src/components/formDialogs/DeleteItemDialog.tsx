'use client';

import { buildTx, getTransactionLink } from '@/lib/client/solana';
import { FormEvent, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { TransactionToast } from '../TransactionToast';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTrigger,
} from '../ui/dialog';
import { WalletGuardButton } from '../WalletGuardButton';
import { useItems } from '@/providers/ItemsProvider';
import { unlistItemIx } from '@/lib/instructions';
import { PublicKey } from '@solana/web3.js';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { FormDialogTitle } from '@/components/FormDialogTitle';
import { FormDialogContent } from '../FormDialogContent';
import { FormDialogFooter } from '../FormDialogFooter';
import { FormSubmitButton } from '../FormSubmitButton';
import { FormCancelButton } from '../FormCancelButton';
import { sendTx } from '@/lib/api';

export function DeleteItemDialog({
  name,
  itemPda,
  storePda,
}: {
  name: string;
  itemPda: string;
  storePda: string;
}) {
  const { publicKey, signTransaction } = useUnifiedWallet();
  const { itemsMutate } = useItems();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      toast.promise(
        async () => {
          if (!publicKey || !signTransaction) {
            throw new Error('Wallet not connected.');
          }

          setIsSubmitting(true);

          let tx = await buildTx(
            [
              await unlistItemIx({
                authority: publicKey,
                itemPda: new PublicKey(itemPda),
                storePda: new PublicKey(storePda),
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
            await itemsMutate(
              (prev) => {
                if (!prev) {
                  throw new Error('Items should not be null.');
                }

                return prev.filter((item) => {
                  return item.publicKey !== itemPda;
                });
              },
              {
                revalidate: false,
              }
            );

            setIsOpen(false);
            setIsSubmitting(false);

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
            return err.message || 'Something went wrong.';
          },
        }
      );
    },
    [itemsMutate, itemPda, publicKey, signTransaction, storePda]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <WalletGuardButton variant="outline" size={'icon'} setOpen={setIsOpen}>
          <Trash2 />
        </WalletGuardButton>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Delete Item" />
          <DialogDescription className="text-foreground">
            Are you sure you want to delete {name}? Warning: reviews will be
            lost forever!
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <FormDialogFooter>
            <FormCancelButton onClick={() => setIsOpen(false)} />
            <FormSubmitButton
              Icon={Trash2}
              text="Delete Item"
              disabled={isSubmitting}
              variant="destructive"
              className="text-foreground"
            />
          </FormDialogFooter>
        </form>
      </FormDialogContent>
    </Dialog>
  );
}
