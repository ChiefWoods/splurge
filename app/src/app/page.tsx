'use client';

import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { MainSection } from '@/components/MainSection';
import { EmptyResult } from '@/components/EmptyResult';
import { SectionHeader } from '@/components/SectionHeader';
import { atomicToUsd, truncateAddress } from '@/lib/utils';
import { ItemsProvider, useItems } from '@/providers/ItemsProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { StoresProvider, useStores } from '@/providers/StoresProvider';
import { useWallet } from '@jup-ag/wallet-adapter';
import { ShoppingBasket, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useMobile } from '@/hooks/useMobile';
import { ItemCardInfoText } from '@/components/ItemCardInfoText';
import { SplurgeClient } from '@/classes/SplurgeClient';

function Section() {
  const { publicKey } = useWallet();
  const { shopperData } = useShopper();
  const { storesData, storesLoading } = useStores();
  const { itemsData, itemsLoading } = useItems();
  const { isMobile } = useMobile();

  const filteredItems = useMemo(() => {
    if (!itemsData) return [];

    let filtered = itemsData.filter(({ inventoryCount }) => inventoryCount > 0);

    if (publicKey) {
      const storePda = SplurgeClient.getStorePda(publicKey);
      filtered = filtered.filter(({ store }) => store !== storePda.toBase58());
    }

    return filtered;
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
                        <ItemCardInfoText text={`${atomicToUsd(price)} USD`} />
                        <ItemCardInfoText
                          text={`${inventoryCount} left`}
                          className="hidden md:block"
                        />
                      </div>
                      <div className="flex h-fit items-center justify-between gap-1">
                        <Link href={`/stores/${storePda}`}>
                          <div className="flex items-center gap-x-2">
                            <Image
                              src={itemStore.image}
                              alt={itemStore.name}
                              width={isMobile ? 20 : 28}
                              height={isMobile ? 20 : 28}
                              className="rounded-full"
                            />
                            <div className="hidden min-w-0 flex-1 flex-col md:flex">
                              <p className="w-full truncate text-xs font-medium md:text-sm">
                                {itemStore.name}
                              </p>
                              <p className="text-foreground text-xs md:text-sm">
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
          <EmptyResult
            Icon={ShoppingBasket}
            text="No items listed. Check back later!"
          />
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
