import { Skeleton } from './ui/skeleton';

export function ReviewRowSkeleton() {
  return (
    <li className="flex flex-col gap-y-4">
      <div className="flex w-full gap-y-2">
        <div className="flex w-full items-center justify-start gap-x-2">
          <Skeleton className="aspect-square size-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex w-full items-center justify-end gap-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <Skeleton className="h-4 w-2/3" />
    </li>
  );
}
