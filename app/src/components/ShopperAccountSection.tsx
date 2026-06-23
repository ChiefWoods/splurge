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
      key={shopper.data.address}
      header="My Profile"
      title={shopper.data.name}
      image={shopper.data.image}
      prefix="Shopper ID:"
      address={shopper.data.address}
      content={<p>{shopper.data.address}</p>}
      buttons={
        publicKey?.toBase58() === shopper.data.authority && (
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
