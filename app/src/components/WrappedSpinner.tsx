import { Spinner } from './ui/spinner';

export function WrappedSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="text-muted-foreground size-15" />
    </div>
  );
}
