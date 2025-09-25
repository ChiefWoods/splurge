import { truncateAddress } from '@/lib/utils';
import { getAccountLink } from '@/lib/solana-client';
import { AccountLinkButton } from './AccountLinkButton';

export function AccountLinkText({
  prefix,
  subject,
}: {
  prefix: string;
  subject: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-muted-foreground">
        {prefix} {truncateAddress(subject)}
      </p>
      <AccountLinkButton href={getAccountLink(subject)} />
    </div>
  );
}
