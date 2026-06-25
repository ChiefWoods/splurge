"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Image from "next/image";
import { ReactNode, useMemo, useState } from "react";

import { ACCEPTED_MINTS_METADATA } from "@/lib/constants";
import { capitalizeFirstLetter, atomicToUsd } from "@/lib/utils";
import { useSettings } from "@/providers/SettingsProvider";
import { ParsedItem, ParsedOrder } from "@/types/accounts";

import { AccountLinkButton } from "./AccountLinkButton";
import { InfoTooltip } from "./InfoTooltip";
import { MintIcon } from "./MintIcon";
import { OrderTablePagination } from "./OrderTablePagination";
import { OrderTableRow } from "./OrderTableRow";
import { SortButton } from "./SortButton";
import { TimestampTooltip } from "./TimestampTooltip";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader } from "./ui/table";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

const ORDER_TABS = ["all", "pending", "shipping", "completed", "cancelled"];

type OrderWithItem = ParsedOrder & {
  itemData: ParsedItem;
  statusElement: ReactNode;
};

export function OrderTable({
  orders,
  items,
  isFetching = false,
  showTotalTooltip = false,
  statusRenderer,
}: {
  orders: ParsedOrder[] | undefined;
  items: ParsedItem[] | undefined;
  isFetching?: boolean;
  showTotalTooltip?: boolean;
  statusRenderer: (order: ParsedOrder) => ReactNode;
}) {
  const { getAccountLink } = useSettings();
  const [sorting, setSorting] = useState<SortingState>([{ id: "timestamp", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [tabValue, setTabValue] = useState<string>("all");
  const [searchValue, setSearchValue] = useState<string>("");

  const data = useMemo<OrderWithItem[]>(() => {
    if (!orders || !items) return [];

    const itemByAddress = new Map(items.map((item) => [item.address, item]));
    const search = searchValue.toLowerCase();
    const rows: OrderWithItem[] = [];

    for (const order of orders) {
      const itemData = itemByAddress.get(order.data.item);

      if (!itemData) {
        throw new Error("Matching item not found for order.");
      }

      if (tabValue !== "all" && order.data.status !== tabValue) continue;
      if (search && !itemData.data.name.toLowerCase().includes(search)) continue;

      rows.push({
        ...order,
        itemData,
        statusElement: statusRenderer(order),
      });
    }

    return rows;
  }, [orders, items, tabValue, searchValue, statusRenderer]);

  const columns = useMemo<ColumnDef<OrderWithItem>[]>(
    () => [
      {
        accessorKey: "status",
        // header: 'Status',
        header: () => <span className="text-foreground">Status</span>,
        cell: ({ row }) => row.original.statusElement,
        enableSorting: false,
      },
      {
        accessorKey: "itemData.data.name",
        header: ({ column }) => <SortButton text="Item" column={column} />,
        cell: ({ row }) => {
          const { itemData } = row.original;
          return (
            <div className="flex items-center gap-x-4">
              <Image
                src={itemData.data.image}
                alt={itemData.data.name}
                width={40}
                height={40}
                className="shrink-0 rounded-lg object-cover"
              />
              <span className="truncate">{itemData.data.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "data.amount",
        header: ({ column }) => <SortButton text="Amount" column={column} />,
      },
      {
        id: "total",
        accessorFn: (row) => BigInt(row.data.paymentSubtotal) + BigInt(row.data.platformFee),
        header: ({ column }) => (
          <div className="flex items-center gap-2">
            <SortButton text="Total" column={column} />
            {showTotalTooltip && (
              <InfoTooltip text="A small additional platform fee is applied on top of each order." />
            )}
          </div>
        ),
        cell: ({ row }) => {
          const { paymentSubtotal, platformFee, paymentMint } = row.original.data;
          const metadata = ACCEPTED_MINTS_METADATA.get(paymentMint);

          if (!metadata) {
            throw new Error(`Metadata not found for mint: ${paymentMint}`);
          }

          return (
            <div className="flex items-center gap-x-2">
              <span className="truncate">
                {atomicToUsd(BigInt(paymentSubtotal) + BigInt(platformFee))}
              </span>
              <MintIcon src={metadata.image} alt={metadata.name} />
            </div>
          );
        },
      },
      {
        id: "timestamp",
        accessorKey: "data.timestamp",
        header: ({ column }) => <SortButton text="Created At" column={column} />,
        cell: ({ row }) => <TimestampTooltip timestamp={row.original.data.timestamp} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <AccountLinkButton href={getAccountLink(row.original.address)} />,
        enableSorting: false,
      },
    ],
    [showTotalTooltip, getAccountLink],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <Tabs
      defaultValue="all"
      value={tabValue}
      onValueChange={(value) => setTabValue(value)}
      className="flex w-full flex-1 flex-col gap-y-3 md:gap-y-6"
    >
      <TabsList className="flex w-full max-w-full overflow-x-auto">
        {ORDER_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="text-background flex-1">
            <span>{capitalizeFirstLetter(tab)}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <Input
        placeholder="Search items..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-secondary">
            {table.getHeaderGroups().map((headerGroup) => (
              <OrderTableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </OrderTableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <OrderTableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Loading...
                </TableCell>
              </OrderTableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <OrderTableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </OrderTableRow>
              ))
            ) : (
              <OrderTableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No orders found.
                </TableCell>
              </OrderTableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <OrderTablePagination table={table} />
    </Tabs>
  );
}
