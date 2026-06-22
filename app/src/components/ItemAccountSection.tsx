"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { ShoppingCart } from "lucide-react";

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

  return (
    <>
      <AccountSection
        key={item.publicKey}
        title={item.name}
        image={item.image}
        prefix="Item ID:"
        address={store.publicKey}
        content={
          <>
            <ItemCardInfoText text={item.description} />
            <ItemCardInfoText text={`${atomicToUsd(item.price)} USD`} />
            <ItemCardInfoText text={`${item.inventoryCount} in inventory`} />
          </>
        }
        buttons={
          publicKey?.toBase58() !== store.authority &&
          item.inventoryCount > 0 && (
            <AccountSectionButtonTab>
              <CheckoutDialog item={item} store={store} config={config}>
                <ShoppingCart />
                Buy
              </CheckoutDialog>
            </AccountSectionButtonTab>
          )
        }
      />
    </>
  );
}
