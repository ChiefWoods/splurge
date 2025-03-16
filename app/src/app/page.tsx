'use client';

import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { truncateAddress } from '@/lib/utils';
import { useItem } from '@/providers/ItemProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { useStore } from '@/providers/StoreProvider';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Page() {
  const { shopper } = useShopper();
  const { allItems, itemMutating, triggerAllItems } = useItem();
  const { allStores, storeMutating, triggerAllStores } = useStore();

  triggerAllItems({});
  triggerAllStores();

  return (
    <section className="main-section flex-1">
      <h2 className="w-full">
        {shopper?.name
          ? `Welcome back, ${shopper.name}`
          : 'Welcome to Splurge!'}
      </h2>
      <div className="flex w-full flex-1 flex-wrap gap-6">
        {itemMutating || storeMutating ? (
          <>
            {[...Array(6)].map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </>
        ) : allItems?.length && allStores?.length ? (
          <>
            {allItems.map(
              ({ publicKey, name, image, inventoryCount, price, store }) => {
                const itemStore = allStores.find(
                  ({ publicKey }) => publicKey === store
                );

                if (!itemStore) {
                  throw new Error('Matching store not found for item.');
                }

                return (
                  <ItemCard
                    key={publicKey}
                    itemPda={publicKey}
                    itemName={name}
                    itemImage={image}
                    inventoryCount={inventoryCount}
                    price={price}
                    storeName={itemStore.name}
                    storePda={store}
                  >
                    <div className="flex h-fit items-center justify-between">
                      <Link href={`/stores/${store}`}>
                        <div className="flex gap-x-2">
                          <Image
                            src={itemStore.image}
                            alt={itemStore.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div className="flex flex-col">
                            <p className="truncate text-sm font-semibold">
                              {itemStore.name}
                            </p>
                            <p className="muted-text text-sm">
                              {truncateAddress(store)}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <CheckoutDialog
                        name={name}
                        image={image}
                        price={price}
                        maxAmount={inventoryCount}
                        storePda={store}
                        itemPda={publicKey}
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
          <p className="muted-text my-auto w-full text-center">
            No items listed. Check back later!
          </p>
        )}
      </div>
    </section>
  );
}
