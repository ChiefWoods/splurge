import { Button } from './ui/button';
import { SquareArrowOutUpRight } from 'lucide-react';
import { getAccountLink, truncateAddress } from '@/lib/utils';
import Link from 'next/link';

export function AccountLinkText({
  prefix,
  subject,
}: {
  prefix: string;
  subject: string;
}) {
  return (
    <div className="flex items-center gap-x-2">
      <p className="text-muted-foreground">
        {prefix} {truncateAddress(subject)}
      </p>
      <Button asChild size={'icon'} type="button" variant={'ghost'}>
        <Link href={getAccountLink(subject)} target="_blank">
          <SquareArrowOutUpRight />
        </Link>
      </Button>
    </div>
  );
}
