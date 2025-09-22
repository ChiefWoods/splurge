'use client';

import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { NoResultText } from '@/components/NoResultText';
import { getStorePda } from '@/lib/pda';
import { atomicToUsd, truncateAddress } from '@/lib/utils';
import { ItemsProvider, useItems } from '@/providers/ItemsProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { StoresProvider, useStores } from '@/providers/StoresProvider';
import { ParsedItem } from '@/types/accounts';
import { useWallet } from '@jup-ag/wallet-adapter';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function Section() {
  const { publicKey } = useWallet();
  const { shopperData } = useShopper();
  const { storesData, storesLoading } = useStores();
  const { itemsData, itemsLoading } = useItems();
  const [filteredItems, setFilteredItems] = useState<ParsedItem[]>([]);

  useEffect(() => {
    if (itemsData) {
      let filteredItems = itemsData.filter(
        ({ inventoryCount }) => inventoryCount > 0
      );

      if (publicKey) {
        const storePda = getStorePda(publicKey);

        filteredItems = filteredItems.filter(
          ({ store }) => store !== storePda.toBase58()
        );
      }

      setFilteredItems(filteredItems);
    }
  }, [itemsData, publicKey]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full">
        {shopperData?.name
          ? `Welcome back, ${shopperData.name}`
          : 'Welcome to Splurge!'}
      </h2>
      <div className="flex w-full flex-1 flex-wrap gap-6">
        {itemsLoading || storesLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </>
        ) : itemsData?.length && storesData?.length && filteredItems.length ? (
          <>
            {filteredItems.map(
              ({
                publicKey: itemPda,
                name,
                image,
                inventoryCount,
                price,
                store: storePda,
              }) => {
                const itemStore = storesData?.find(
                  ({ publicKey }) => publicKey === storePda
                );
                if (!itemStore) {
                  throw new Error('Matching store not found for item.');
                }
                return (
                  <ItemCard
                    key={itemPda}
                    itemPda={itemPda}
                    itemName={name}
                    itemImage={image}
                    storeName={itemStore.name}
                    storePda={storePda}
                  >
                    <>
                      <div className="flex w-full justify-between gap-y-1 overflow-hidden">
                        <p className="muted-text">{atomicToUsd(price)} USD</p>
                        <p className="muted-text">{inventoryCount} left</p>
                      </div>
                      <div className="flex h-fit items-center justify-between gap-1">
                        <Link href={`/stores/${storePda}`}>
                          <div className="flex gap-x-2">
                            <Image
                              src={itemStore.image}
                              alt={itemStore.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div className="flex min-w-0 flex-1 flex-col">
                              <p className="w-full truncate text-sm font-semibold">
                                {itemStore.name}
                              </p>
                              <p className="muted-text text-sm">
                                {truncateAddress(storePda)}
                              </p>
                            </div>
                          </div>
                        </Link>
                        <CheckoutDialog
                          name={name}
                          image={image}
                          price={price}
                          maxAmount={inventoryCount}
                          storePda={storePda}
                          storeAuthority={itemStore.authority}
                          itemPda={itemPda}
                          btnVariant="default"
                          btnSize="icon"
                        >
                          <ShoppingCart />
                        </CheckoutDialog>
                      </div>
                    </>
                  </ItemCard>
                );
              }
            )}
          </>
        ) : (
          <NoResultText text="No items listed. Check back later!" />
        )}
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <StoresProvider>
      <ItemsProvider>
        <Section />
      </ItemsProvider>
    </StoresProvider>
  );
}
