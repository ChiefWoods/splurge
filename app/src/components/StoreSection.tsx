'use client';

import { useItems } from '@/providers/ItemsProvider';
import { SectionHeader } from './SectionHeader';
import { ItemCard } from './ItemCard';
import { EmptyResult } from './EmptyResult';
import { ShoppingBasket } from 'lucide-react';
import { ItemCardInfoText } from './ItemCardInfoText';
import { ItemActionButtons } from './ItemActionButtons';
import { atomicToUsd } from '@/lib/utils';
import { ItemCardSkeleton } from './ItemCardSkeleton';
import { ParsedConfig, ParsedStore } from '@/types/accounts';

export function StoreSection({
  store,
  config,
}: {
  store: ParsedStore;
  config: ParsedConfig;
}) {
  const { itemsData, itemsLoading } = useItems();

  return (
    <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-3 md:gap-6">
      <SectionHeader text="Store Items" />
      <div className="flex w-full flex-1 flex-wrap gap-6">
        <>
          {itemsLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </>
          ) : itemsData && itemsData.length > 0 ? (
            itemsData.map((item) => (
              <ItemCard key={item.publicKey} item={item} store={store}>
                <>
                  <div className="flex w-full flex-col justify-between overflow-hidden">
                    <ItemCardInfoText text={`${atomicToUsd(item.price)} USD`} />
                    <ItemCardInfoText text={`${item.inventoryCount} left`} />
                  </div>
                  <ItemActionButtons
                    item={item}
                    store={store}
                    config={config}
                  />
                </>
              </ItemCard>
            ))
          ) : (
            <EmptyResult Icon={ShoppingBasket} text="No items listed." />
          )}
        </>
      </div>
    </section>
  );
}
