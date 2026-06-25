"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { CircleDollarSign, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useMobile } from "@/hooks/useMobile";
import { ParsedStore } from "@/types/accounts";

import { AccountSection } from "./AccountSection";
import { AccountSectionButtonTab } from "./AccountSectionButtonTab";
import { AddItemDialog } from "./formDialogs/AddItemDialog";
import { Button } from "./ui/button";

const storeActionButtons = [
  {
    path: "orders",
    Icon: ClipboardList,
    text: "Manage Orders",
  },
  {
    path: "earnings",
    Icon: CircleDollarSign,
    text: "View Earnings",
  },
];

export function StoreAccountSection({ store }: { store: ParsedStore }) {
  const { publicKey } = useUnifiedWallet();
  const { isMobile } = useMobile();
  const publicKeyString = publicKey?.toBase58();
  const content = useMemo(() => <p>{store.data.about}</p>, [store.data.about]);
  const buttons = useMemo(
    () =>
      publicKeyString === store.data.authority && (
        <AccountSectionButtonTab>
          <AddItemDialog storePda={store.address} />
          {storeActionButtons.map(({ path, Icon, text }) => {
            const href = `/stores/${store.address}/${path}`;

            return (
              <Button
                key={href}
                asChild
                size={isMobile ? "icon" : "sm"}
                className="aspect-square size-8 md:aspect-auto md:size-auto"
              >
                <Link href={href}>
                  <Icon />
                  <span className="hidden md:block">{text}</span>
                </Link>
              </Button>
            );
          })}
        </AccountSectionButtonTab>
      ),
    [isMobile, publicKeyString, store.address, store.data.authority],
  );

  return (
    <AccountSection
      key={store.address}
      title={store.data.name}
      image={store.data.image}
      prefix="Store ID:"
      address={store.address}
      content={content}
      buttons={buttons}
    />
  );
}
