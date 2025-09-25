import { Button } from './ui/button';

export function FormCancelButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size={'sm'} onClick={onClick}>
      Cancel
    </Button>
  );
}
