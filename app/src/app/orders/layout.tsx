import { Metadata } from "next";
import { ReactNode } from "react";

import { CommonMain } from "@/components/CommonMain";

export const metadata: Metadata = {
  title: "My Orders",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <CommonMain>{children}</CommonMain>;
}
