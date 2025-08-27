'use client';

import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { NoResultText } from '@/components/NoResultText';
import { truncateAddress } from '@/lib/utils';
import { useItem } from '@/providers/ItemProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { useStore } from '@/providers/StoreProvider';
import { ParsedItem } from '@/types/accounts';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Page() {
  const { shopper } = useShopper();
  const { allItems } = useItem();
  const { allStores, personalStore } = useStore();
  const [filteredItems, setFilteredItems] = useState<ParsedItem[]>([]);

  useEffect(() => {
    (async () => {
      await allItems.trigger({});
      await allStores.trigger();
    })();
  }, []);

  useEffect(() => {
    if (allItems.data) {
      const filteredItems = allItems.data
        .filter(({ store }) => store !== personalStore.data?.publicKey)
        .filter(({ inventoryCount }) => inventoryCount > 0);

      setFilteredItems(filteredItems);
    }
  }, [allItems, personalStore]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full">
        {shopper.data?.name
          ? `Welcome back, ${shopper.data.name}`
          : 'Welcome to Splurge!'}
      </h2>
      <div className="flex w-full flex-1 flex-wrap gap-6">
        {allItems.isMutating ||
        allStores.isMutating ||
        personalStore.isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </>
        ) : allItems.data?.length &&
          allStores.data?.length &&
          filteredItems.length ? (
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
                const itemStore = allStores.data?.find(
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
                    inventoryCount={inventoryCount}
                    price={price}
                    storeName={itemStore.name}
                    storePda={storePda}
                  >
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
                        itemPda={itemPda}
                        btnVariant="default"
                        btnSize="icon"
                      >
                        <ShoppingCart />
                      </CheckoutDialog>
                    </div>
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
