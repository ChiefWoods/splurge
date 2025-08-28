'use client';

import { ReactNode, useEffect, useState } from 'react';
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
import { SortButton } from './SortButton';
import { capitalizeFirstLetter } from '@/lib/utils';
import { ParsedItem, ParsedOrder } from '@/types/accounts';
import { SWRMutationResponse } from 'swr/mutation';
import { InfoTooltip } from './InfoTooltip';

const ORDER_TABS = ['all', 'pending', 'shipping', 'completed', 'cancelled'];

enum SortOption {
  Name,
  Amount,
  Total,
  Date,
}

export function OrderTable({
  allOrders,
  allItems,
  showTotalTooltip = false,
  sortedOrdersMapper,
}: {
  allOrders: SWRMutationResponse<
    ParsedOrder[],
    any,
    string,
    {
      shopperPda?: string;
      storePda?: string;
    }
  >;
  allItems: SWRMutationResponse<
    ParsedItem[],
    any,
    string,
    {
      storePda?: string;
    }
  >;
  showTotalTooltip?: boolean;
  sortedOrdersMapper: (sortedOrders: ParsedOrder) => ReactNode;
}) {
  const [sortedOrders, setSortedOrders] = useState<ParsedOrder[]>([]);
  const [tabValue, setTabValue] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [sortNameAsc, setSortNameAsc] = useState<boolean>(true);
  const [sortAmountAsc, setSortAmountAsc] = useState<boolean>(false);
  const [sortTotalAsc, setSortTotalAsc] = useState<boolean>(false);
  const [sortDateAsc, setSortDateAsc] = useState<boolean>(false);
  const [activeSortColumn, setActiveSortColumn] = useState<SortOption>(
    SortOption.Date
  );

  useEffect(() => {
    if (allOrders.data && allItems.data) {
      const sortedOrders = allOrders.data
        .filter((order) => {
          return tabValue === 'all'
            ? true
            : // @ts-expect-error status is a DecodeEnum but is actually a string
              order.status === tabValue;
        })
        .filter((order) => {
          const item = allItems.data?.find(
            ({ publicKey }) => publicKey === order.item
          );

          if (!item) {
            throw new Error('Matching item not found for order.');
          }

          return item.name.toLowerCase().includes(searchValue.toLowerCase());
        })
        .sort((a, b) => {
          switch (activeSortColumn) {
            case SortOption.Amount:
              return sortAmountAsc ? a.amount - b.amount : b.amount - a.amount;

            case SortOption.Total:
              const totalA = a.paymentSubtotal + a.platformFee;
              const totalB = b.paymentSubtotal + b.platformFee;
              return sortTotalAsc ? totalA - totalB : totalB - totalA;

            case SortOption.Date:
              return sortDateAsc
                ? a.timestamp - b.timestamp
                : b.timestamp - a.timestamp;

            case SortOption.Name:
            default:
              const itemA = allItems.data?.find(
                ({ publicKey }) => publicKey === a.item
              );
              const itemB = allItems.data?.find(
                ({ publicKey }) => publicKey === b.item
              );

              if (!itemA || !itemB) {
                throw new Error('Matching item not found for order.');
              }

              return sortNameAsc
                ? itemA.name.localeCompare(itemB.name)
                : itemB.name.localeCompare(itemA.name);
          }
        });

      setSortedOrders(sortedOrders ?? []);
    }
  }, [
    allOrders,
    allItems,
    tabValue,
    searchValue,
    sortNameAsc,
    sortAmountAsc,
    sortTotalAsc,
    sortDateAsc,
    activeSortColumn,
  ]);

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
        placeholder="Search..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Status</TableHead>
            <TableHead>
              <SortButton
                onClick={() => {
                  setActiveSortColumn(SortOption.Name);
                  setSortNameAsc(!sortNameAsc);
                }}
                state={sortNameAsc}
              >
                Item
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton
                onClick={() => {
                  setActiveSortColumn(SortOption.Amount);
                  setSortAmountAsc(!sortAmountAsc);
                }}
                state={sortAmountAsc}
              >
                Amount
              </SortButton>
            </TableHead>
            <TableHead className="flex items-center gap-2">
              <SortButton
                onClick={() => {
                  setActiveSortColumn(SortOption.Total);
                  setSortTotalAsc(!sortTotalAsc);
                }}
                state={sortTotalAsc}
              >
                Total
              </SortButton>
              {showTotalTooltip && (
                <InfoTooltip text="A small additional platform fee is applied on top of each order." />
              )}
            </TableHead>
            <TableHead>
              <SortButton
                onClick={() => {
                  setActiveSortColumn(SortOption.Date);
                  setSortDateAsc(!sortDateAsc);
                }}
                state={sortDateAsc}
              >
                Created At
              </SortButton>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allOrders.isMutating || allItems.isMutating ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : allItems.data && sortedOrders.length ? (
            sortedOrders.map(sortedOrdersMapper)
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <p className="muted-text text-sm">{sortedOrders.length} item(s) found.</p>
    </Tabs>
  );
}
