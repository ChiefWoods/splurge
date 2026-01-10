import { ReactNode } from 'react';
import { CommonSection } from './CommonSection';

export function CreateSection({
  header,
  children,
}: {
  header: string;
  children: ReactNode;
}) {
  return (
    <CommonSection>
      <h2 className="text-center text-2xl font-medium">{header}</h2>
      {children}
    </CommonSection>
  );
}
