import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Create Shopper',
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
