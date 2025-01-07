import Image from 'next/image';
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
    <section className="flex w-full flex-col gap-y-8">
      {header && <h2 className="w-full text-start">{header}</h2>}
      <div className="flex h-fit w-full gap-x-6">
        <Image
          src={image}
          className="aspect-square h-[200px] w-[200px] rounded-lg border"
          width={200}
          height={200}
          alt={title}
        />
        <Card className="flex w-full flex-1 flex-col justify-between gap-y-4 overflow-hidden border-none shadow-none">
          <CardHeader className="flex flex-1 flex-col p-0">
            <CardTitle className="max-w-full truncate">{title}</CardTitle>
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
