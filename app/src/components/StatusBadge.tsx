import { capitalizeFirstLetter } from '@/lib/utils';
import { Badge } from './ui/badge';

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

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={getStatusColor(status)}>
      {capitalizeFirstLetter(status)}
    </Badge>
  );
}
