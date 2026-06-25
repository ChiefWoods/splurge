"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { ParsedShopper } from "@/types/accounts";

import { AccountSection } from "./AccountSection";
import { Button } from "./ui/button";

export function ShopperAccountSection({ shopper }: { shopper: ParsedShopper }) {
  const { publicKey } = useUnifiedWallet();
  const publicKeyString = publicKey?.toBase58();
  const content = useMemo(() => <p>{shopper.data.address}</p>, [shopper.data.address]);
  const buttons = useMemo(
    () =>
      publicKeyString === shopper.data.authority && (
        <Button asChild size={"sm"}>
          <Link href="/orders">
            <ClipboardList />
            View Orders
          </Link>
        </Button>
      ),
    [publicKeyString, shopper.data.authority],
  );

  return (
    <AccountSection
      key={shopper.address}
      header="My Profile"
      title={shopper.data.name}
      image={shopper.data.image}
      prefix="Shopper ID:"
      address={shopper.address}
      content={content}
      buttons={buttons}
    />
  );
}
