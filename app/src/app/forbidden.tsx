'use client';

import { ErrorSection } from '@/components/ErrorSection';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Forbidden() {
  const router = useRouter();

  return (
    <ErrorSection
      Icon={RotateCcw}
      btnText="Go To Home"
      description="You do not have permission to access this page."
      onClick={() => router.replace('/')}
      title="403 - Forbidden"
    />
  );
}
