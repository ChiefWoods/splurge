import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { ReviewRowSkeleton } from '@/components/ReviewRowSkeleton';
import { SectionHeaderSkeleton } from '@/components/SectionHeaderSkeleton';
import { Separator } from '@/components/ui/separator';

export default function Loading() {
  return (
    <>
      <AccountSectionSkeleton />
      <Separator />
      <section className="flex w-full flex-col gap-6">
        <SectionHeaderSkeleton />
        {Array.from({ length: 3 }).map((_, i) => (
          <ReviewRowSkeleton key={i} />
        ))}
      </section>
    </>
  );
}
