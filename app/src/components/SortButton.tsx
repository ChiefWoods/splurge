import { ReactNode } from 'react';
import { Button } from './ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';

export function SortButton({
  onClick,
  state,
  children,
}: {
  onClick: () => void;
  state: boolean;
  children?: ReactNode;
}) {
  return (
    <Button size={'sm'} variant={'ghost'} onClick={onClick}>
      {children}
      {state ? <ArrowUp /> : <ArrowDown />}
    </Button>
  );
}
