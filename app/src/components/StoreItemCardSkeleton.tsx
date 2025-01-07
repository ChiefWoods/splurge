import { Skeleton } from './ui/skeleton';

export function StoreItemCardSkeleton() {
  return (
    <div className="box-content flex w-[200px] flex-col gap-y-2 rounded-lg border p-4">
      <div className="flex flex-col gap-y-2 p-0">
        <Skeleton className="aspect-square h-full w-full rounded-lg" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex w-full items-end gap-x-4 p-0">
        <div className="flex w-full flex-col gap-y-1">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}
