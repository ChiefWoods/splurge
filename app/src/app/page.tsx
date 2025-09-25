'use client';

import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { MainSection } from '@/components/MainSection';
import { NoResultText } from '@/components/NoResultText';
import { SectionHeader } from '@/components/SectionHeader';
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
    <MainSection className="flex-1">
      <SectionHeader
        text={
          shopperData?.name
            ? `Welcome back, ${shopperData.name}`
            : 'Welcome to Splurge!'
        }
      />
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
                        <p>{atomicToUsd(price)} USD</p>
                        <p>{inventoryCount} left</p>
                      </div>
                      <div className="flex h-fit items-center justify-between gap-1">
                        <Link href={`/stores/${storePda}`}>
                          <div className="flex items-center gap-x-2">
                            <Image
                              src={itemStore.image}
                              alt={itemStore.name}
                              width={28}
                              height={28}
                              className="rounded-full"
                            />
                            <div className="flex min-w-0 flex-1 flex-col">
                              <p className="w-full truncate text-sm font-medium">
                                {itemStore.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
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
    </MainSection>
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
