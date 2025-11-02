import { truncateAddress } from '@/lib/utils';
import { AccountLinkButton } from './AccountLinkButton';

export function AccountLinkText({
  prefix,
  subject,
  href,
}: {
  prefix: string;
  subject: string;
  href: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-muted-foreground">
        {prefix} {truncateAddress(subject)}
      </p>
      <AccountLinkButton href={href} />
    </div>
  );
}
