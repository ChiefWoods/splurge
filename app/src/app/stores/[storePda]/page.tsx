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
import { useEffect } from 'react';
import { atomicToUsd } from '@/lib/utils';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { publicKey } = useWallet();
  const { storeData, storeIsMutating, storeTrigger } = useStore();
  const { allItemsData, allItemsIsMutating, allItemsTrigger } = useItem();

  useEffect(() => {
    (async () => {
      await storeTrigger({ publicKey: storePda });
      await allItemsTrigger({ storePda });

      if (!storeIsMutating && !allItemsIsMutating && !storeData) {
        notFound();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storePda]);

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
      {storeIsMutating ? (
        <AccountSectionSkeleton />
      ) : (
        storeData && (
          <AccountSection
            key={storePda}
            title={storeData.name}
            image={storeData.image}
            prefix="Store ID:"
            address={storePda}
            content={<p className="text-primary">{storeData.about}</p>}
            buttons={
              publicKey &&
              storeData.publicKey === getStorePda(publicKey).toBase58() && (
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
          {allItemsIsMutating || storeIsMutating ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </>
          ) : allItemsData?.length ? (
            allItemsData.map(
              ({
                publicKey: pda,
                name,
                image,
                description,
                inventoryCount,
                price,
              }) =>
                storeData && (
                  <ItemCard
                    key={pda}
                    itemPda={pda}
                    itemName={name}
                    itemImage={image}
                    storePda={storePda}
                  >
                    <>
                      <div className="flex w-full flex-col justify-between overflow-hidden">
                        <p className="muted-text">{atomicToUsd(price)} USD</p>
                        <p className="muted-text">{inventoryCount} left</p>
                      </div>
                      {publicKey &&
                      storeData.publicKey ===
                        getStorePda(publicKey).toBase58() ? (
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
                    </>
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
