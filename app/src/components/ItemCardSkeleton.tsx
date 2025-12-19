import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

export function ItemCardSkeleton() {
  return (
    <div className="bg-secondary/50 box-content flex h-fit w-fit flex-col gap-y-2 rounded-lg p-4 md:w-[200px]">
      <div className="flex flex-col gap-y-1 p-0 md:gap-y-2">
        <Skeleton className="aspect-square size-[100px] rounded-lg md:size-[200px]" />
        <Skeleton className="h-6 w-full md:h-8" />
      </div>
      <div className="flex w-full items-end gap-x-4 p-0">
        <div className="flex w-full flex-col gap-y-2">
          <Skeleton className="h-4 w-1/2 md:h-6 md:w-1/3" />
          <Skeleton className="hidden h-6 w-1/2 md:block" />
          <div className="flex w-full items-center justify-between md:hidden">
            <Skeleton className="aspect-square h-6 rounded-full" />
            <Skeleton className="aspect-square h-7 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
