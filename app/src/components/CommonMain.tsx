import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function CommonMain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'flex w-full max-w-[762px] flex-1 flex-col items-start justify-start gap-y-2 p-4 md:gap-y-6 md:p-6',
        className
      )}
    >
      {children}
    </main>
  );
}
