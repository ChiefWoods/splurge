"use client";

import { useWallet } from "@jup-ag/wallet-adapter";
import { findStorePda } from "@splurge/sdk";
import { ShoppingBasket, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyResult } from "@/components/EmptyResult";
import { CheckoutDialog } from "@/components/formDialogs/CheckoutDialog";
import { ItemCard } from "@/components/ItemCard";
import { ItemCardInfoText } from "@/components/ItemCardInfoText";
import { SectionHeader } from "@/components/SectionHeader";
import { atomicToUsd, truncateAddress } from "@/lib/utils";
import { useShopper } from "@/providers/ShopperProvider";
import { ParsedConfig, ParsedItem, ParsedStore } from "@/types/accounts";

import { ItemCardSkeleton } from "./ItemCardSkeleton";
import { Skeleton } from "./ui/skeleton";

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
    let filtered = items.filter(({ data }) => data.inventoryCount > 0);

    if (publicKey) {
      // filter out items from personal store
      const storePda = findStorePda({ authority: publicKey })[0];
      filtered = filtered.filter(({ data }) => data.store !== storePda.toBase58());
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
            shopperData?.data.name
              ? `Welcome back, ${shopperData.data.name}`
              : "Welcome to Splurge!"
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
              const store = stores.find(({ address }) => address === item.data.store);

              if (!store) {
                throw new Error("Matching store not found for item.");
              }

              return (
                <ItemCard key={item.address} item={item} store={store}>
                  <>
                    <div className="flex w-full justify-between gap-y-1 overflow-hidden">
                      <ItemCardInfoText text={`${atomicToUsd(item.data.price)} USD`} />
                      <ItemCardInfoText
                        text={`${item.data.inventoryCount} left`}
                        className="hidden md:block"
                      />
                    </div>
                    <div className="flex h-fit items-center justify-between gap-1">
                      <Link href={`/stores/${item.data.store}`}>
                        <div className="flex items-center gap-x-2">
                          <Image
                            src={store.data.image}
                            alt={store.data.name}
                            width={0}
                            height={0}
                            className="size-5 rounded-full md:size-7"
                          />
                          <div className="hidden min-w-0 flex-1 flex-col md:flex">
                            <p className="w-full truncate text-xs font-medium md:text-sm">
                              {store.data.name}
                            </p>
                            <p className="text-foreground text-xs md:text-sm">
                              {truncateAddress(item.data.store)}
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
          <EmptyResult Icon={ShoppingBasket} text="No items listed. Check back later!" />
        )}
      </div>
    </>
  );
}
