import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "./ui/button";

export function SortButton<TData>({ text, column }: { text: string; column: Column<TData> }) {
  const Icon =
    column.getIsSorted() === "asc"
      ? ArrowUp
      : column.getIsSorted() === "desc"
        ? ArrowDown
        : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="text-foreground h-auto p-0 hover:bg-transparent"
    >
      {text}
      <Icon className="ml-2 size-4" />
    </Button>
  );
}
