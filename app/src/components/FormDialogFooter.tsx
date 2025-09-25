import { ReactNode } from 'react';
import { DialogFooter } from './ui/dialog';

export function FormDialogFooter({ children }: { children: ReactNode }) {
  return (
    <DialogFooter className="flex justify-end gap-2">{children}</DialogFooter>
  );
}
