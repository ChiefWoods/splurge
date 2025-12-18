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
} from './ui/table';
import { capitalizeFirstLetter, atomicToUsd } from '@/lib/utils';
import { ParsedItem, ParsedOrder } from '@/types/accounts';
import { InfoTooltip } from './InfoTooltip';
import { TimestampTooltip } from './TimestampTooltip';
import Image from 'next/image';
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { OrderTablePagination } from './OrderTablePagination';
import { AccountLinkButton } from './AccountLinkButton';
import { SortButton } from './SortButton';
import { OrderTableRow } from './OrderTableRow';
import { MintIcon } from './MintIcon';
import { useSettings } from '@/providers/SettingsProvider';

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
  const { getAccountLink } = useSettings();
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
        // header: 'Status',
        header: () => <span className="text-foreground">Status</span>,
        cell: ({ row }) => row.original.statusElement,
        enableSorting: false,
      },
      {
        accessorKey: 'itemData.name',
        header: ({ column }) => <SortButton text="Item" column={column} />,
        cell: ({ row }) => {
          const { itemData } = row.original;
          return (
            <div className="flex items-center gap-x-4">
              <Image
                src={itemData.image}
                alt={itemData.name}
                width={40}
                height={40}
                className="flex-shrink-0 rounded-lg object-cover"
              />
              <span className="truncate">{itemData.name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <SortButton text="Amount" column={column} />,
      },
      {
        id: 'total',
        accessorFn: (row) => row.paymentSubtotal + row.platformFee,
        header: ({ column }) => (
          <div className="flex items-center gap-2">
            <SortButton text="Total" column={column} />
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
              <MintIcon src={metadata.image} alt={metadata.name} />
            </div>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: ({ column }) => (
          <SortButton text="Created At" column={column} />
        ),
        cell: ({ row }) => (
          <TimestampTooltip timestamp={row.original.timestamp} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <AccountLinkButton href={getAccountLink(row.original.publicKey)} />
        ),
        enableSorting: false,
      },
    ],
    [showTotalTooltip, getAccountLink]
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
      className="flex w-full flex-1 flex-col gap-y-6"
    >
      <TabsList className="flex w-full">
        {ORDER_TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-1 text-background">
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
                <OrderTableRow
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
