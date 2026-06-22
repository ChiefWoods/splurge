"use client";

import { ReactNode } from "react";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";

export function WalletGuardButton({
  variant = "default",
  size = "default",
  className,
  setOpen,
  children,
}: {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "icon" | "sm" | "lg";
  className?: string;
  setOpen: (open: boolean) => void;
  children: ReactNode;
}) {
  const { checkAuth } = useWalletAuth();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(size === "icon" ? "aspect-square size-8" : "", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        checkAuth(() => setOpen(true));
      }}
    >
      {children}
    </Button>
  );
}
