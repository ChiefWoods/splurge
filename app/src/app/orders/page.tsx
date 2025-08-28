'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParsedOrder } from '@/types/accounts';
import { ACCEPTED_MINTS_METADATA, ORDER_TABS } from '@/lib/constants';
import { getShopperPda } from '@/lib/pda';
import { atomicToUsd, capitalizeFirstLetter } from '@/lib/utils';
import { getAccountLink } from '@/lib/solana-helpers';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { Tabs } from '@radix-ui/react-tabs';
import { useWallet } from '@solana/wallet-adapter-react';
import { SquareArrowOutUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { StatusBadge } from '@/components/StatusBadge';
import { NoResultText } from '@/components/NoResultText';
import { TimestampTooltip } from '@/components/TimestampTooltip';
import { SortButton } from '@/components/SortButton';

enum SortOption {
  Name,
  Amount,
  Total,
  Date,
}

export default function Page() {
  const { publicKey } = useWallet();
  const { allOrders } = useOrder();
  const { allItems } = useItem();
  const [sortedOrders, setSortedOrders] = useState<ParsedOrder[]>([]);
  const [tabValue, setTabValue] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [sortNameAsc, setSortNameAsc] = useState<boolean>(true);
  const [sortAmountAsc, setSortAmountAsc] = useState<boolean>(false);
  const [sortTotalAsc, setSortTotalAsc] = useState<boolean>(false);
  const [sortDateAsc, setSortDateAsc] = useState<boolean>(false);
  const [activeSortColumn, setActiveSortColumn] = useState<SortOption>(
    SortOption.Name
  );

  useEffect(() => {
    if (!publicKey) return;

    (async () => {
      await allOrders.trigger({
        shopperPda: getShopperPda(publicKey).toBase58(),
      });
      await allItems.trigger({});
    })();
  }, [publicKey]);

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
    <section className="main-section flex-1">
      <h2 className="w-full text-start">My Orders</h2>
      {publicKey ? (
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
                  <InfoTooltip text="A small additional platform fee is applied on top of each order." />
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
                sortedOrders.map(
                  ({
                    amount,
                    item,
                    paymentMint,
                    paymentSubtotal,
                    platformFee,
                    publicKey: orderPda,
                    status,
                    timestamp,
                  }) => {
                    const orderItem = allItems.data?.find(
                      ({ publicKey }) => publicKey === item
                    );

                    if (!orderItem) {
                      throw new Error('Matching item not found for order.');
                    }

                    return (
                      <TableRow key={orderPda}>
                        <TableCell>
                          {/* @ts-expect-error status is a DecodeEnum but is actually a string */}
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-x-4">
                            <div className="h-12 w-12 rounded-lg border bg-[#f4f4f5] p-1">
                              <Image
                                src={orderItem.image}
                                alt={orderItem.name}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="text-md">{orderItem.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{amount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-x-2">
                            <span>
                              {atomicToUsd(paymentSubtotal + platformFee)}
                            </span>
                            <Image
                              src={
                                ACCEPTED_MINTS_METADATA.get(paymentMint)!.image
                              }
                              alt="payment token"
                              width={20}
                              height={20}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <TimestampTooltip timestamp={timestamp} />
                        </TableCell>
                        <TableCell>
                          <Button
                            asChild
                            size={'icon'}
                            type="button"
                            variant={'ghost'}
                            className="h-fit w-fit"
                          >
                            <Link
                              href={getAccountLink(orderPda)}
                              target="_blank"
                            >
                              <SquareArrowOutUpRight />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <p className="muted-text text-sm">
            {sortedOrders.length} item(s) found.
          </p>
        </Tabs>
      ) : (
        <NoResultText text="Connect your wallet to view your orders." />
      )}
    </section>
  );
}
