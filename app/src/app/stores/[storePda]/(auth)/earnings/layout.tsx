import { StoreTokenAccountProvider } from '@/providers/StoreTokenAccountProvider';
import { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return <StoreTokenAccountProvider>{children}</StoreTokenAccountProvider>;
}
