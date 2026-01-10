import { CommonMain } from '@/components/CommonMain';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <CommonMain className="items-center">{children}</CommonMain>;
}
