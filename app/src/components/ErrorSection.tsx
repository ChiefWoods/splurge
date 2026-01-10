'use client';

import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { CommonMain } from './CommonMain';
import { LucideProps } from 'lucide-react';
import { Button } from './ui/button';

export function ErrorSection({
  title,
  description,
  Icon,
  onClick,
  btnText,
}: {
  title: string;
  description: string;
  Icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
  onClick: () => void;
  btnText: string;
}) {
  return (
    <CommonMain className="flex-1 items-center justify-center">
      <h2 className="text-xl font-medium">{title}</h2>
      <p>{description}</p>
      <Button onClick={onClick}>
        <Icon />
        {btnText}
      </Button>
    </CommonMain>
  );
}
