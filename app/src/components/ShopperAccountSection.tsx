"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

import { ParsedShopper } from "@/types/accounts";

import { AccountSection } from "./AccountSection";
import { Button } from "./ui/button";

export function ShopperAccountSection({ shopper }: { shopper: ParsedShopper }) {
  const { publicKey } = useUnifiedWallet();

  return (
    <AccountSection
      key={shopper.publicKey}
      header="My Profile"
      title={shopper.name}
      image={shopper.image}
      prefix="Shopper ID:"
      address={shopper.publicKey}
      content={<p>{shopper.address}</p>}
      buttons={
        publicKey?.toBase58() === shopper.authority && (
          <Button asChild size={"sm"}>
            <Link href="/orders">
              <ClipboardList />
              View Orders
            </Link>
          </Button>
        )
      }
    />
  );
}
