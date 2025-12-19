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
    <div className="flex flex-wrap items-start gap-x-2 md:items-center">
      <p className="text-muted text-nowrap">{prefix}</p>
      <AccountLinkButton href={href} text={truncateAddress(subject)} />
    </div>
  );
}
