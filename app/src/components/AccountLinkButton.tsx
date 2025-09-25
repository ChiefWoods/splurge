import Link from 'next/link';
import { Button } from './ui/button';
import { SquareArrowOutUpRight } from 'lucide-react';

export function AccountLinkButton({ href }: { href: string }) {
  return (
    <Button
      asChild
      size={'icon'}
      variant={'ghost'}
      className="group size-fit bg-transparent p-1 hover:bg-transparent"
    >
      <Link href={href} target="_blank">
        <SquareArrowOutUpRight className="text-muted-foreground transition-colors group-hover:text-muted" />
      </Link>
    </Button>
  );
}
