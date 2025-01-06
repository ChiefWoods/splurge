import { ReactNode } from 'react';

export function CreateSection({
  header,
  children,
}: {
  header: string;
  children: ReactNode;
}) {
  return (
    <section className="main-section only:my-auto">
      <h2 className="text-center">{header}</h2>
      {children}
    </section>
  );
}
