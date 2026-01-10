'use client';

import { ErrorSection } from '@/components/ErrorSection';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <ErrorSection
      Icon={ArrowLeft}
      btnText="Go Back"
      description="Page not found."
      onClick={router.back}
      title="404"
    />
  );
}
