"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { CircleDollarSign, ClipboardList } from "lucide-react";
import Link from "next/link";

import { useMobile } from "@/hooks/useMobile";
import { ParsedStore } from "@/types/accounts";

import { AccountSection } from "./AccountSection";
import { AccountSectionButtonTab } from "./AccountSectionButtonTab";
import { AddItemDialog } from "./formDialogs/AddItemDialog";
import { Button } from "./ui/button";

export function StoreAccountSection({ store }: { store: ParsedStore }) {
  const { publicKey } = useUnifiedWallet();
  const { isMobile } = useMobile();

  const buttons = [
    {
      href: `/stores/${store.publicKey}/orders`,
      Icon: ClipboardList,
      text: "Manage Orders",
    },
    {
      href: `/stores/${store.publicKey}/earnings`,
      Icon: CircleDollarSign,
      text: "View Earnings",
    },
  ];

  return (
    <AccountSection
      key={store.publicKey}
      title={store.name}
      image={store.image}
      prefix="Store ID:"
      address={store.publicKey}
      content={<p>{store.about}</p>}
      buttons={
        publicKey?.toBase58() === store.authority && (
          <AccountSectionButtonTab>
            <AddItemDialog storePda={store.publicKey} />
            {buttons.map(({ href, Icon, text }) => (
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
            ))}
          </AccountSectionButtonTab>
        )
      }
    />
  );
}
