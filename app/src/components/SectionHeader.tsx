import { cn } from '@/lib/utils';

export function SectionHeader({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        'text-primary w-full text-start text-2xl font-medium',
        className
      )}
    >
      {text}
    </h2>
  );
}
