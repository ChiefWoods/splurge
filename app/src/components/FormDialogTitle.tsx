import { DialogTitle } from './ui/dialog';

export function FormDialogTitle({ title }: { title: string }) {
  return (
    <DialogTitle className="text-primary text-start text-xl font-medium">
      {title}
    </DialogTitle>
  );
}
