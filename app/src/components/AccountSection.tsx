import { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { AccountLinkText } from './AccountLinkText';
import { SectionHeader } from './SectionHeader';
import { LargeImage } from './LargeImage';

export function AccountSection({
  header,
  title,
  image,
  prefix,
  address,
  content,
  buttons,
}: {
  header?: string;
  title: string;
  image: string;
  prefix: string;
  address: string;
  content: ReactNode;
  buttons?: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-6">
      {header && <SectionHeader text={header} />}
      <div className="flex h-fit w-full gap-x-6">
        <LargeImage src={image} alt={title} />
        <Card className="flex w-full flex-1 flex-col justify-between gap-y-4 overflow-hidden border-none shadow-none">
          <CardHeader className="flex flex-1 flex-col p-0">
            <CardTitle className="truncate font-medium">{title}</CardTitle>
            <CardDescription>
              <AccountLinkText prefix={prefix} subject={address} />
            </CardDescription>
            <CardContent className="flex flex-1 flex-col gap-y-1 p-0">
              {content}
            </CardContent>
          </CardHeader>
          <CardFooter className="flex justify-end p-0">{buttons}</CardFooter>
        </Card>
      </div>
    </section>
  );
}
