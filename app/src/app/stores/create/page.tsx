"use client";

import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { Store } from "lucide-react";

import { AlreadyCreatedEmpty } from "@/components/AlreadyCreatedEmpty";
import { ConnectWalletEmpty } from "@/components/ConnectWalletEmpty";
import { CreateSection } from "@/components/CreateSection";
import { CreateStoreDialog } from "@/components/formDialogs/CreateStoreDialog";
import { WrappedSpinner } from "@/components/WrappedSpinner";
import { useStore } from "@/providers/StoreProvider";

export default function Page() {
  const { publicKey } = useUnifiedWallet();
  const { storeData, storeLoading } = useStore();

  if (!publicKey) {
    return <ConnectWalletEmpty />;
  }

  if (storeLoading) {
    return <WrappedSpinner />;
  }

  return storeData ? (
    <AlreadyCreatedEmpty
      Icon={Store}
      title="Store Already Created"
      btnText="Go To Store"
      description="Only one store is allowed per wallet."
      redirectHref={`/stores/${storeData.address}`}
    />
  ) : (
    <CreateSection header="Create your Store to start offering splurges!">
      <CreateStoreDialog />
    </CreateSection>
  );
}
