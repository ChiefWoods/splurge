'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <section className="main-section">
      <h2>{error.digest ?? error.name}</h2>
      <p>{error.message}</p>
      <Button onClick={reset}>
        <RotateCcw />
        Try Again
      </Button>
    </section>
  );
}
