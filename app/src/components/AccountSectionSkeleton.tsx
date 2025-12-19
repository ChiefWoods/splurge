import { Skeleton } from './ui/skeleton';

export function AccountSectionSkeleton({
  header = false,
}: {
  header?: boolean;
}) {
  return (
    <section className="flex w-full flex-col gap-6">
      {header && <Skeleton className="h-6 w-1/2 md:h-8" />}
      <div className="flex h-fit w-full flex-col gap-x-6 gap-y-2 sm:flex-row">
        <Skeleton className="aspect-square size-[100px] rounded-lg md:size-[200px]" />
        <div className="flex w-full flex-1 flex-col justify-between overflow-hidden border-none shadow-none">
          <div className="flex flex-1 flex-col gap-y-2 p-0 md:gap-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-3 w-2/3 md:h-4" />
            <Skeleton className="h-3 w-2/3 md:h-4" />
            <Skeleton className="h-3 w-1/5 md:h-4" />
            <Skeleton className="h-3 w-1/5 md:h-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
