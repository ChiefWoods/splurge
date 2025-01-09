'use client';

import { CreateSection } from '@/components/CreateSection';
import { Spinner } from '@/components/Spinner';
import { CreateProfileDialog } from '@/components/formDialogs/CreateProfileDialog';
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { getShopperPda } from '@/lib/pda';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

export default function Page() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { getShopperAcc } = useAnchorProgram();

  const shopper = useSWR(
    publicKey ? { url: '/api/shoppers/create', publicKey } : null,
    async ({ publicKey }) => {
      const pda = getShopperPda(publicKey);
      const acc = await getShopperAcc(pda);

      if (acc) {
        router.replace(`/shoppers/${pda}`);
      }

      return { pda };
    }
  );

  if (shopper.isLoading) {
    return <Spinner />;
  }

  return (
    <CreateSection header="Create your Shopper profile to start splurging!">
      <CreateProfileDialog shopper={shopper} />
    </CreateSection>
  );
}
