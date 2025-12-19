import { cn } from '@/lib/utils';

export function ItemCardInfoText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <p className={cn('text-sm md:text-base', className)}>{text}</p>;
}
