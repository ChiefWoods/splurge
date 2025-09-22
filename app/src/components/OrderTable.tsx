'use client';

import { ReactNode, useMemo, useState } from 'react';
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
} from '@tanstack/react-table';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { capitalizeFirstLetter, atomicToUsd } from '@/lib/utils';
import { ParsedItem, ParsedOrder } from '@/types/accounts';
import { InfoTooltip } from './InfoTooltip';
import { TimestampTooltip } from './TimestampTooltip';
import Image from 'next/image';
import Link from 'next/link';
import { getAccountLink } from '@/lib/solana-client';
import { SquareArrowOutUpRight } from 'lucide-react';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const ORDER_TABS = ['all', 'pending', 'shipping', 'completed', 'cancelled'];

type OrderWithItem = ParsedOrder & {
  itemData: ParsedItem;
  statusElement: ReactNode;
};

export function OrderTable({
  ordersData,
  itemsData,
  isFetching,
  showTotalTooltip = false,
  statusRenderer,
}: {
  ordersData: ParsedOrder[] | undefined;
  itemsData: ParsedItem[] | undefined;
  isFetching: boolean;
  showTotalTooltip?: boolean;
  statusRenderer: (order: ParsedOrder) => ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [tabValue, setTabValue] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');

  const data = useMemo<OrderWithItem[]>(() => {
    if (!ordersData || !itemsData) return [];

    return ordersData
      .map((order) => {
        const itemData = itemsData.find(
          ({ publicKey }) => publicKey === order.item
        );

        if (!itemData) {
          throw new Error('Matching item not found for order.');
        }

        return {
          ...order,
          itemData,
          statusElement: statusRenderer(order),
        };
      })
      .filter((order) => {
        if (tabValue !== 'all') {
          if (order.status !== tabValue) return false;
        }

        if (searchValue) {
          return order.itemData.name
            .toLowerCase()
            .includes(searchValue.toLowerCase());
        }

        return true;
      });
  }, [ordersData, itemsData, tabValue, searchValue, statusRenderer]);

  const columns = useMemo<ColumnDef<OrderWithItem>[]>(
    () => [
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.statusElement,
        enableSorting: false,
      },
      {
        accessorKey: 'itemData.name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 hover:bg-transparent"
          >
            Item
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const { itemData } = row.original;
          return (
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 flex-shrink-0 rounded-lg border bg-[#f4f4f5] p-1">
                <Image
                  src={itemData.image}
                  alt={itemData.name}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-md truncate">{itemData.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 hover:bg-transparent"
          >
            Amount
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
      },
      {
        id: 'total',
        accessorFn: (row) => row.paymentSubtotal + row.platformFee,
        header: ({ column }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === 'asc')
              }
              className="h-auto p-0 hover:bg-transparent"
            >
              Total
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
            {showTotalTooltip && (
              <InfoTooltip text="A small additional platform fee is applied on top of each order." />
            )}
          </div>
        ),
        cell: ({ row }) => {
          const { paymentSubtotal, platformFee, paymentMint } = row.original;
          const metadata = ACCEPTED_MINTS_METADATA.get(paymentMint);

          if (!metadata) {
            throw new Error(`Metadata not found for mint: ${paymentMint}`);
          }

          return (
            <div className="flex items-center gap-x-2">
              <span className="truncate">
                {atomicToUsd(paymentSubtotal + platformFee)}
              </span>
              <Image
                src={metadata.image}
                alt={metadata.name}
                width={20}
                height={20}
                className="flex-shrink-0"
              />
            </div>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 hover:bg-transparent"
          >
            Created At
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <TimestampTooltip timestamp={row.original.timestamp} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            asChild
            size={'icon'}
            type="button"
            variant={'ghost'}
            className="h-fit w-fit"
          >
            <Link href={getAccountLink(row.original.publicKey)} target="_blank">
              <SquareArrowOutUpRight />
            </Link>
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [showTotalTooltip]
  );

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
      className="flex w-full flex-1 flex-col gap-y-6"
    >
      <TabsList className="flex w-full">
        {ORDER_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-1">
            {capitalizeFirstLetter(tab)}
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
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isFetching ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          {table.getRowCount()} item(s) found.
        </p>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </Tabs>
  );
}
