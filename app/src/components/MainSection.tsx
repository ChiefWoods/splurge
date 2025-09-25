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
        'flex w-full max-w-[762px] flex-col items-center gap-y-6 py-6',
        className
      )}
    >
      {children}
    </main>
  );
}
