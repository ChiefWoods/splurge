import { Skeleton } from './ui/skeleton';

export function ReviewRowSkeleton() {
  return (
    <li className="flex flex-col gap-y-4">
      <div className="flex w-full gap-y-2">
        <div className="flex w-full items-center justify-start gap-x-2">
          <Skeleton className="aspect-square h-[40px] w-[40px] rounded-full" />
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="flex w-full items-center justify-end gap-x-2">
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
      <Skeleton className="h-4 w-2/3" />
    </li>
  );
}
