"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { ShoppingCart } from "lucide-react";
import { useMemo } from "react";

import { atomicToUsd } from "@/lib/utils";
import { ParsedConfig, ParsedItem, ParsedStore } from "@/types/accounts";

import { AccountSection } from "./AccountSection";
import { AccountSectionButtonTab } from "./AccountSectionButtonTab";
import { CheckoutDialog } from "./formDialogs/CheckoutDialog";
import { ItemCardInfoText } from "./ItemCardInfoText";

export function ItemAccountSection({
  store,
  item,
  config,
}: {
  store: ParsedStore;
  item: ParsedItem;
  config: ParsedConfig;
}) {
  const { publicKey } = useUnifiedWallet();
  const publicKeyString = publicKey?.toBase58();
  const content = useMemo(
    () => (
      <>
        <ItemCardInfoText text={item.data.description} />
        <ItemCardInfoText text={`${atomicToUsd(item.data.price)} USD`} />
        <ItemCardInfoText text={`${item.data.inventoryCount} in inventory`} />
      </>
    ),
    [item.data.description, item.data.inventoryCount, item.data.price],
  );
  const buttons = useMemo(
    () =>
      publicKeyString !== store.data.authority &&
      item.data.inventoryCount > 0 && (
        <AccountSectionButtonTab>
          <CheckoutDialog item={item} store={store} config={config}>
            <ShoppingCart />
            Buy
          </CheckoutDialog>
        </AccountSectionButtonTab>
      ),
    [config, item, publicKeyString, store],
  );

  return (
    <AccountSection
      key={item.address}
      title={item.data.name}
      image={item.data.image}
      prefix="Item ID:"
      address={item.address}
      content={content}
      buttons={buttons}
    />
  );
}
