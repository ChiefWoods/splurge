import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { SectionHeaderSkeleton } from '@/components/SectionHeaderSkeleton';
import { Separator } from '@/components/ui/separator';

export default function Loading() {
  return (
    <>
      <AccountSectionSkeleton />
      <Separator />
      <section className="flex w-full flex-col gap-6">
        <SectionHeaderSkeleton />
        <div className="flex w-full flex-1 flex-wrap gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  );
}
