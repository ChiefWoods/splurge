import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";

export function EmptyResult({
  Icon,
  text,
}: {
  Icon?: ForwardRefExoticComponent<LucideProps> & RefAttributes<SVGSVGElement>;
  text: string;
}) {
  return (
    <Empty>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon" className="bg-secondary">
            <Icon className="text-secondary-foreground" />
          </EmptyMedia>
        )}
        <EmptyTitle className="text-secondary-foreground my-auto w-full text-center">
          {text}
        </EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
