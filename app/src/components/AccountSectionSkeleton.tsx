import { Skeleton } from './ui/skeleton';

export function AccountSectionSkeleton({
  header = false,
}: {
  header?: boolean;
}) {
  return (
    <section className="flex w-full flex-col gap-y-8">
      {header && <Skeleton className="h-8 w-1/2" />}
      <div className="flex h-fit w-full gap-x-6">
        <Skeleton className="aspect-square h-[200px] w-[200px] rounded-lg" />
        <div className="flex w-full flex-1 flex-col justify-between overflow-hidden border-none shadow-none">
          <div className="flex flex-1 flex-col gap-y-4 p-0">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </section>
  );
}
