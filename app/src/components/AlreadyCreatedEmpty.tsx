import { LucideProps } from "lucide-react";
import Link from "next/link";
import { ForwardRefExoticComponent, RefAttributes } from "react";

import { Button } from "./ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";

export function AlreadyCreatedEmpty({
  Icon,
  title,
  description,
  redirectHref,
  btnText,
}: {
  Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  title: string;
  description?: string;
  redirectHref?: string;
  btnText?: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-primary-foreground bg-primary">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
        {redirectHref && btnText && (
          <EmptyContent>
            <Button asChild>
              <Link href={redirectHref}>{btnText}</Link>
            </Button>
          </EmptyContent>
        )}
      </EmptyHeader>
    </Empty>
  );
}
