'use client';

import { ErrorSection } from '@/components/ErrorSection';
import { RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorSection
      Icon={RotateCcw}
      btnText="Try Again"
      description={error.message}
      onClick={reset}
      title={error.digest ?? error.name}
    />
  );
}
