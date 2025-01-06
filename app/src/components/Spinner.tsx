import { Loader2 } from 'lucide-react';

export function Spinner() {
  return (
    <Loader2
      className="flex animate-spin items-center text-muted only:my-auto"
      size={60}
    />
  );
}
