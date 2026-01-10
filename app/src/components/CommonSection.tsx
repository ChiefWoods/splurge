import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export function CommonSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex w-full flex-1 flex-col items-center justify-center gap-4',
        className
      )}
    >
      {children}
    </section>
  );
}
