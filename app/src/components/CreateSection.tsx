import { ReactNode } from 'react';
import { MainSection } from './MainSection';

export function CreateSection({
  header,
  children,
}: {
  header: string;
  children: ReactNode;
}) {
  return (
    <MainSection className="only:my-auto">
      <h2 className="text-center text-2xl font-medium">{header}</h2>
      {children}
    </MainSection>
  );
}
