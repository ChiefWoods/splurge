"use client";

import { ShoppingBasket } from "lucide-react";

import { atomicToUsd } from "@/lib/utils";
import { useItems } from "@/providers/ItemsProvider";
import { ParsedConfig, ParsedStore } from "@/types/accounts";

import { EmptyResult } from "./EmptyResult";
import { ItemActionButtons } from "./ItemActionButtons";
import { ItemCard } from "./ItemCard";
import { ItemCardInfoText } from "./ItemCardInfoText";
import { ItemCardSkeleton } from "./ItemCardSkeleton";
import { SectionHeader } from "./SectionHeader";

export function StoreSection({ store, config }: { store: ParsedStore; config: ParsedConfig }) {
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
              <ItemCard key={item.address} item={item} store={store}>
                <>
                  <div className="flex w-full flex-col justify-between overflow-hidden">
                    <ItemCardInfoText text={`${atomicToUsd(item.data.price)} USD`} />
                    <ItemCardInfoText text={`${item.data.inventoryCount} left`} />
                  </div>
                  <ItemActionButtons item={item} store={store} config={config} />
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
