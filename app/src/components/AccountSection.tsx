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
import { getAccountLink, truncateAddress } from '@/lib/utils';
import { Button } from './ui/button';
import Link from 'next/link';
import { SquareArrowOutUpRight } from 'lucide-react';

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
  content: string;
  buttons?: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-y-8">
      {header && <h2 className="w-full text-start">{header}</h2>}
      <div className="flex h-fit w-full gap-x-6">
        <Image
          src={image}
          className="aspect-square rounded-lg border"
          width={200}
          height={200}
          alt={title}
        />
        <Card className="flex w-full flex-1 flex-col justify-between gap-y-4 overflow-hidden border-none shadow-none">
          <CardHeader className="flex flex-1 flex-col p-0">
            <CardTitle className="max-w-full truncate">{title}</CardTitle>
            <CardDescription className="flex items-center gap-x-2">
              <p className="muted-text">
                {prefix} {truncateAddress(address)}
              </p>
              <Button asChild size={'icon'} type="button" variant={'link'}>
                <Link href={getAccountLink(address)} target="_blank">
                  <SquareArrowOutUpRight />
                </Link>
              </Button>
            </CardDescription>
            <CardContent className="flex-1 p-0">
              <p className="text-primary">{content}</p>
            </CardContent>
          </CardHeader>
          <CardFooter className="flex justify-end p-0">{buttons}</CardFooter>
        </Card>
      </div>
    </section>
  );
}
