import { ReactNode } from 'react';

export function AccountSectionButtonTab({ children }: { children: ReactNode }) {
  return <div className="flex gap-x-2">{children}</div>;
}
