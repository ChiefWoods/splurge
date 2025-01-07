'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { AddItemDialog } from '@/components/formDialogs/AddItemDialog';
import { StoreItemCard } from '@/components/StoreItemCard';
import { StoreItemCardSkeleton } from '@/components/StoreItemCardSkeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getStorePda } from '@/lib/pda';
import { StoreItem } from '@/types/idlAccounts';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { CircleDollarSign, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import useSWR from 'swr';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { publicKey } = useWallet();
  const { getStoreAcc, getMultipleStoreItemAcc } = useAnchorProgram();

  const store = useSWR(
    { url: `/api/stores/${storePda}`, publicKey },
    async ({ publicKey }) => {
      const acc = await getStoreAcc(new PublicKey(storePda));

      let isOwner = false;
      let items: (StoreItem & { pda: string })[] = [];

      if (acc) {
        if (publicKey) {
          isOwner = getStorePda(publicKey).toBase58() === storePda;
        }

        items = (await getMultipleStoreItemAcc(acc.items))
          .filter((item) => item !== null)
          .map((item: StoreItem, i) => {
            return {
              ...item,
              pda: acc.items[i].toBase58(),
            };
          });
      }

      return { acc, isOwner, items };
    }
  );

  if (store.data && !store.data.acc) {
    notFound();
  }

  const buttons = [
    {
      href: `/stores/${storePda}/orders`,
      icon: <ClipboardList />,
      text: 'Manage Orders',
    },
    {
      href: `/stores/${storePda}/earnings`,
      icon: <CircleDollarSign />,
      text: 'View Earnings',
    },
  ];

  return (
    <section className="main-section flex-1">
      {store.isLoading ? (
        <AccountSectionSkeleton />
      ) : (
        store.data &&
        store.data.acc && (
          <AccountSection
            key={storePda}
            title={store.data.acc.name}
            image={store.data.acc.image}
            prefix="Store ID:"
            address={storePda}
            content={<p className="text-primary">{store.data.acc.about}</p>}
            buttons={
              store.data.isOwner && (
                <div className="flex gap-x-2">
                  <AddItemDialog mutate={store.mutate} />
                  {buttons.map(({ href, icon, text }) => (
                    <Button
                      key={href}
                      asChild
                      variant={'secondary'}
                      size={'sm'}
                    >
                      <Link href={href}>
                        {icon}
                        {text}
                      </Link>
                    </Button>
                  ))}
                </div>
              )
            }
          />
        )
      )}
      <Separator />
      <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-y-8">
        <h2>Store Items</h2>
        <div className="flex w-full flex-1 flex-wrap gap-6">
          {store.isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <StoreItemCardSkeleton key={i} />
              ))}
            </>
          ) : store.data && store.data.items.length ? (
            store.data.items.map(
              ({ pda, name, image, description, inventoryCount, price }) =>
                store.data && (
                  <StoreItemCard
                    key={pda}
                    pda={pda}
                    name={name}
                    image={image}
                    description={description}
                    inventoryCount={inventoryCount.toNumber()}
                    price={price}
                    isOwner={store.data.isOwner}
                    mutate={store.mutate}
                  />
                )
            )
          ) : (
            <p className="my-auto w-full text-center text-muted-foreground">
              No Items Listed.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
