import { cva } from "class-variance-authority";
import { ReactNode } from "react";

import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { ParsedOrderStatus } from "@/types/accounts";

import { Badge } from "./ui/badge";

const badgeVariants = cva("flex w-fit items-center gap-2", {
  variants: {
    status: {
      pending: "bg-pending hover:bg-pending",
      shipping: "bg-shipping hover:bg-shipping",
      completed: "bg-completed hover:bg-completed",
      cancelled: "bg-cancelled hover:bg-cancelled",
    },
  },
});

export function StatusBadge({
  status,
  className,
  onClick,
  children,
}: {
  status: ParsedOrderStatus;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <Badge className={cn(badgeVariants({ status }), className)} onClick={onClick}>
      <span className="text-background">{capitalizeFirstLetter(status)}</span>
      {children}
    </Badge>
  );
}
