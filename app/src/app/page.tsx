'use client';

import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { StoreItemCard } from '@/components/StoreItemCard';
import { StoreItemCardSkeleton } from '@/components/StoreItemCardSkeleton';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getShopperPda, getStorePda } from '@/lib/pda';
import { truncateAddress } from '@/lib/utils';
import { Store, StoreItem } from '@/types/idlAccounts';
import { ProgramAccount } from '@coral-xyz/anchor';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';

export default function Page() {
  const { publicKey } = useWallet();
  const { getShopperAcc, getMultipleStoreAcc, getAllStoreItemAcc } =
    useAnchorProgram();
  const shopper = useSWR(
    publicKey ? { url: '/api/shopper-name', publicKey } : null,
    async ({ publicKey }) => {
      const pda = getShopperPda(publicKey);
      const acc = await getShopperAcc(pda);

      return { name: acc?.name };
    }
  );
  const allItems = useSWR('/api/stote-items', getAllStoreItemAcc);
  const storeItems = useSWR(
    allItems.data
      ? { url: '/api/store-items', publicKey, allItems: allItems.data }
      : null,
    async ({ publicKey, allItems }) => {
      const storeSet = new Set<PublicKey>();

      const filteredItems = allItems
        .filter(
          (item: ProgramAccount<StoreItem>) =>
            item.account.inventoryCount.toNumber() > 0
        )
        .map((item: ProgramAccount<StoreItem>) => {
          const storePda = item.account.store;

          if (!publicKey || !storePda.equals(getStorePda(publicKey))) {
            storeSet.add(storePda);
          } else {
            return;
          }

          return {
            pda: item.publicKey.toBase58(),
            name: item.account.name,
            image: item.account.image,
            inventoryCount: item.account.inventoryCount.toNumber(),
            price: item.account.price,
            storePda,
          };
        })
        .filter((item) => item !== undefined);

      const storeArr = Array.from(storeSet);
      const allStores = await getMultipleStoreAcc(storeArr);

      const storeMap = new Map(
        allStores
          .filter((store): store is Store => store !== null)
          .map((store, i) => [
            storeArr[i].toBase58(),
            {
              pda: storeArr[i].toBase58(),
              name: store.name,
              image: store.image,
            },
          ])
      );

      const itemsWithStore = filteredItems.map((item) => {
        const store = storeMap.get(item.storePda.toBase58());

        if (!store) {
          throw new Error(`Store not found for item: ${item.pda}`);
        }

        return {
          ...item,
          store,
        };
      });

      return itemsWithStore;
    }
  );

  return (
    <section className="main-section flex-1">
      <h2 className="w-full">
        {shopper.data?.name
          ? `Welcome back, ${shopper.data.name}`
          : 'Welcome to Splurge!'}
      </h2>
      <div className="flex w-full flex-1 flex-wrap gap-6">
        {storeItems.isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <StoreItemCardSkeleton key={i} />
            ))}
          </>
        ) : storeItems.data?.length ? (
          <>
            {storeItems.data.map(
              ({ pda, name, image, inventoryCount, price, store }) => (
                <StoreItemCard
                  key={pda}
                  itemPda={pda}
                  itemName={name}
                  itemImage={image}
                  inventoryCount={inventoryCount}
                  price={price}
                  storeName={store.name}
                  storePda={store.pda}
                >
                  <div className="flex h-fit items-center justify-between">
                    <Link href={`/stores/${store.pda}`}>
                      <div className="flex gap-x-2">
                        <Image
                          src={store.image}
                          alt={store.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex flex-col">
                          <p className="truncate text-sm font-semibold">
                            {store.name}
                          </p>
                          <p className="muted-text text-sm">
                            {truncateAddress(store.pda)}
                          </p>
                        </div>
                      </div>
                    </Link>
                    <CheckoutDialog
                      name={name}
                      image={image}
                      price={price}
                      maxAmount={inventoryCount}
                      storePda={store.pda}
                      storeItemPda={pda}
                      btnVariant="default"
                      btnSize="icon"
                      mutate={storeItems.mutate}
                    >
                      <ShoppingCart />
                    </CheckoutDialog>
                  </div>
                </StoreItemCard>
              )
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
