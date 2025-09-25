import { ReactNode } from 'react';
import { DialogContent } from './ui/dialog';

export function FormDialogContent({ children }: { children: ReactNode }) {
  return (
    <DialogContent className="flex max-h-[500px] flex-col overflow-auto sm:max-w-[425px]">
      {children}
    </DialogContent>
  );
}
