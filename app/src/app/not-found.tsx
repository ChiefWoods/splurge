"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { ErrorSection } from "@/components/ErrorSection";

export default function NotFound() {
  const router = useRouter();

  return (
    <ErrorSection
      Icon={ArrowLeft}
      btnText="Go Back"
      description="Page not found."
      onClick={router.back}
      title="404"
    />
  );
}
