import Link from 'next/link';
import { Button } from './ui/button';
import { SquareArrowOutUpRight } from 'lucide-react';

export function AccountLinkButton({
  href,
  text,
}: {
  href: string;
  text?: string;
}) {
  return (
    <Button
      asChild
      size={'icon'}
      variant={'ghost'}
      className="group size-fit bg-transparent p-0 hover:bg-transparent md:p-1"
    >
      <Link href={href} target="_blank">
        {text && <p className="text-muted font-medium">{text}</p>}
        <SquareArrowOutUpRight className="text-muted group-hover:text-muted/75 transition-colors" />
      </Link>
    </Button>
  );
}
