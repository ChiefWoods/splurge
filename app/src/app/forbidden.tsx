"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { ErrorSection } from "@/components/ErrorSection";

export default function Forbidden() {
  const router = useRouter();

  return (
    <ErrorSection
      Icon={RotateCcw}
      btnText="Go To Home"
      description="You do not have permission to access this page."
      onClick={() => router.replace("/")}
      title="403 - Forbidden"
    />
  );
}
