import { ReactNode } from "react";

import { CommonMain } from "@/components/CommonMain";

export default function Layout({ children }: { children: ReactNode }) {
  return <CommonMain className="items-center">{children}</CommonMain>;
}
