'use client';

import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { ItemCard } from '@/components/ItemCard';
import { EmptyResult } from '@/components/EmptyResult';
import { SectionHeader } from '@/components/SectionHeader';
import { atomicToUsd, truncateAddress } from '@/lib/utils';
import { useShopper } from '@/providers/ShopperProvider';
import { useWallet } from '@jup-ag/wallet-adapter';
import { ShoppingBasket, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { ItemCardInfoText } from '@/components/ItemCardInfoText';
import { SplurgeClient } from '@/classes/SplurgeClient';
import { ParsedConfig, ParsedItem, ParsedStore } from '@/types/accounts';
import { ItemCardSkeleton } from './ItemCardSkeleton';
import { Skeleton } from './ui/skeleton';

export function LandingFeaturedSection({
  items,
  stores,
  config,
}: {
  items: ParsedItem[];
  stores: ParsedStore[];
  config: ParsedConfig;
}) {
  const { publicKey } = useWallet();
  const { shopperData, shopperLoading } = useShopper();

  const filteredItems = useMemo(() => {
    // filter out items with no inventory
    let filtered = items.filter(({ inventoryCount }) => inventoryCount > 0);

    if (publicKey) {
      // filter out items from personal store
      const storePda = SplurgeClient.getStorePda(publicKey);
      filtered = filtered.filter(({ store }) => store !== storePda.toBase58());
    }

    return filtered;
  }, [items, publicKey]);

  return (
    <>
      {shopperLoading ? (
        <Skeleton className="h-8 w-2/5" />
      ) : (
        <SectionHeader
          text={
            shopperData?.name
              ? `Welcome back, ${shopperData.name}`
              : 'Welcome to Splurge!'
          }
        />
      )}
      <div className="flex w-full flex-1 flex-wrap gap-6">
        {shopperLoading ? (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </>
        ) : stores.length > 0 && filteredItems.length > 0 ? (
          <>
            {filteredItems.map((item) => {
              const store = stores.find(
                ({ publicKey }) => publicKey === item.store
              );

              if (!store) {
                throw new Error('Matching store not found for item.');
              }

              return (
                <ItemCard key={item.publicKey} item={item} store={store}>
                  <>
                    <div className="flex w-full justify-between gap-y-1 overflow-hidden">
                      <ItemCardInfoText
                        text={`${atomicToUsd(item.price)} USD`}
                      />
                      <ItemCardInfoText
                        text={`${item.inventoryCount} left`}
                        className="hidden md:block"
                      />
                    </div>
                    <div className="flex h-fit items-center justify-between gap-1">
                      <Link href={`/stores/${item.store}`}>
                        <div className="flex items-center gap-x-2">
                          <Image
                            src={store.image}
                            alt={store.name}
                            width={0}
                            height={0}
                            className="size-5 rounded-full md:size-7"
                          />
                          <div className="hidden min-w-0 flex-1 flex-col md:flex">
                            <p className="w-full truncate text-xs font-medium md:text-sm">
                              {store.name}
                            </p>
                            <p className="text-foreground text-xs md:text-sm">
                              {truncateAddress(item.store)}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <CheckoutDialog
                        config={config}
                        item={item}
                        store={store}
                        btnVariant="default"
                        btnSize="icon"
                      >
                        <ShoppingCart />
                      </CheckoutDialog>
                    </div>
                  </>
                </ItemCard>
              );
            })}
          </>
        ) : (
          <EmptyResult
            Icon={ShoppingBasket}
            text="No items listed. Check back later!"
          />
        )}
      </div>
    </>
  );
}
