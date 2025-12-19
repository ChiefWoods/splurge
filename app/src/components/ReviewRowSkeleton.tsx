import { Skeleton } from './ui/skeleton';

export function ReviewRowSkeleton() {
  return (
    <li className="flex flex-col gap-y-4">
      <div className="flex w-full gap-y-2">
        <div className="flex w-full items-center justify-start gap-x-2">
          <Skeleton className="aspect-square size-6 rounded-full md:size-10" />
          <div className="flex flex-col items-start gap-1 md:flex-row md:items-center">
            <Skeleton className="h-4 w-32 md:h-6" />
            <Skeleton className="h-2 w-24 md:h-4" />
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-x-2">
          <div className="flex flex-col items-end gap-1 md:flex-row md:items-center">
            <Skeleton className="h-2 w-20 md:h-4" />
            <Skeleton className="h-2 w-12 md:h-4" />
          </div>
        </div>
      </div>
      <Skeleton className="h-3 w-2/3 md:h-4" />
    </li>
  );
}
