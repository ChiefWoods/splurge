import { EarningsSection } from '@/components/EarningsSection';
import { getPrices } from '@/lib/client/pyth';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';

export default async function Page() {
  const ids = Array.from(ACCEPTED_MINTS_METADATA.values()).map(
    (metadata) => metadata.id
  );

  const prices = await getPrices(ids);

  return <EarningsSection prices={prices} />;
}
