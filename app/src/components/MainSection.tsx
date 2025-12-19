import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function MainSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'flex w-full max-w-[762px] flex-col items-center gap-y-2 p-4 md:gap-y-6 md:p-6',
        className
      )}
    >
      {children}
    </main>
  );
}
