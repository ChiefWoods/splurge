'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionButtonTab } from '@/components/AccountSectionButtonTab';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { AddItemDialog } from '@/components/formDialogs/AddItemDialog';
import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { DeleteItemDialog } from '@/components/formDialogs/DeleteItemDialog';
import { UpdateItemDialog } from '@/components/formDialogs/UpdateItemDialog';
import { NoResultText } from '@/components/NoResultText';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getStorePda } from '@/lib/pda';
import { useItem } from '@/providers/ItemProvider';
import { useStore } from '@/providers/StoreProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import { CircleDollarSign, ClipboardList, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { publicKey } = useWallet();
  const { store, storeMutating, triggerStore } = useStore();
  const { allItems, itemMutating, triggerAllItems } = useItem();

  triggerStore({ publicKey: storePda });
  triggerAllItems({ storePda });

  if (!storeMutating && !itemMutating && !store) {
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
      {storeMutating ? (
        <AccountSectionSkeleton />
      ) : (
        store && (
          <AccountSection
            key={storePda}
            title={store.name}
            image={store.image}
            prefix="Store ID:"
            address={storePda}
            content={<p className="text-primary">{store.about}</p>}
            buttons={
              publicKey &&
              store.publicKey === getStorePda(publicKey).toBase58() && (
                <AccountSectionButtonTab>
                  <AddItemDialog storePda={storePda} />
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
                </AccountSectionButtonTab>
              )
            }
          />
        )
      )}
      <Separator />
      <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-y-8">
        <h2>Store Items</h2>
        <div className="flex w-full flex-1 flex-wrap gap-6">
          {itemMutating ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </>
          ) : allItems?.length ? (
            allItems.map(
              ({
                publicKey: pda,
                name,
                image,
                description,
                inventoryCount,
                price,
              }) =>
                store && (
                  <ItemCard
                    key={pda}
                    itemPda={pda}
                    itemName={name}
                    itemImage={image}
                    inventoryCount={inventoryCount}
                    price={price}
                    storePda={storePda}
                  >
                    {publicKey &&
                    store.publicKey === getStorePda(publicKey).toBase58() ? (
                      <div className="flex items-end gap-x-2">
                        <UpdateItemDialog
                          name={name}
                          image={image}
                          description={description}
                          price={price}
                          inventoryCount={inventoryCount}
                          itemPda={pda}
                          storePda={storePda}
                        />
                        <DeleteItemDialog
                          name={name}
                          itemPda={pda}
                          storePda={storePda}
                        />
                      </div>
                    ) : (
                      inventoryCount > 0 && (
                        <CheckoutDialog
                          name={name}
                          image={image}
                          price={price}
                          maxAmount={inventoryCount}
                          storePda={storePda}
                          itemPda={pda}
                          btnVariant="default"
                          btnSize="icon"
                        >
                          <ShoppingCart />
                        </CheckoutDialog>
                      )
                    )}
                  </ItemCard>
                )
            )
          ) : (
            <NoResultText text="No items listed." />
          )}
        </div>
      </section>
    </section>
  );
}
