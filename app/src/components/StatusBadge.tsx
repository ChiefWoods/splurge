import { capitalizeFirstLetter, cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ReactNode } from 'react';

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-pending hover:bg-pending';
    case 'shipping':
      return 'bg-shipping hover:bg-shipping';
    case 'completed':
      return 'bg-completed hover:bg-completed';
    case 'cancelled':
      return 'bg-cancelled hover:bg-cancelled';
  }
}

export function StatusBadge({
  status,
  className,
  onClick,
  children,
}: {
  status: string;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <Badge
      className={cn(
        getStatusColor(status),
        className,
        'flex w-fit items-center gap-2'
      )}
      onClick={onClick}
    >
      {capitalizeFirstLetter(status)}
      {children}
    </Badge>
  );
}
