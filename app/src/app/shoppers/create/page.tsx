'use client';

import { AlreadyCreatedEmpty } from '@/components/AlreadyCreatedEmpty';
import { ConnectWalletEmpty } from '@/components/ConnectWalletEmpty';
import { CreateSection } from '@/components/CreateSection';
import { CreateStoreDialog } from '@/components/formDialogs/CreateStoreDialog';
import { WrappedSpinner } from '@/components/WrappedSpinner';
import { useShopper } from '@/providers/ShopperProvider';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { User } from 'lucide-react';

export default function Page() {
  const { publicKey } = useUnifiedWallet();
  const { shopperData, shopperLoading } = useShopper();

  if (!publicKey) {
    return <ConnectWalletEmpty />;
  }

  if (shopperLoading) {
    return <WrappedSpinner />;
  }

  return shopperData ? (
    <AlreadyCreatedEmpty
      Icon={User}
      title="Shopper Already Created"
      btnText="Go To Profile"
      description="Only one shopper profile is allowed per wallet."
      redirectHref={`/shoppers/${shopperData.publicKey}`}
    />
  ) : (
    <CreateSection header="Create your Shopper profile to start splurging!">
      <CreateStoreDialog />
    </CreateSection>
  );
}
