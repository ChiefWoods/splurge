'use client';

import { Badge } from '@/components/ui/badge';
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
import { ACCEPTED_MINTS_METADATA } from '@/lib/constants';
import { getShopperPda } from '@/lib/pda';
import { atomicToUsd, capitalizeFirstLetter } from '@/lib/utils';
import { getAccountLink } from '@/lib/solana-helpers';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { Tabs } from '@radix-ui/react-tabs';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowDown, ArrowUp, SquareArrowOutUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const statusColors: Record<string, string> = {
  pending: 'bg-pending hover:bg-pending',
  shipping: 'bg-shipping hover:bg-shipping',
  completed: 'bg-completed hover:bg-completed',
  cancelled: 'bg-cancelled hover:bg-cancelled',
};

const tabs = ['all', 'pending', 'shipping', 'completed', 'cancelled'];

export default function Page() {
  const { publicKey } = useWallet();
  const { allOrders } = useOrder();
  const { allItems } = useItem();
  const [sortedOrders, setSortedOrders] = useState<ParsedOrder[]>([]);
  const [tabValue, setTabValue] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [showNameAsc, setShowNameAsc] = useState<boolean>(true);

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
            : // @ts-expect-error status is a DecodeEnum but safely parsed as a string
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
          const itemA = allItems.data?.find(
            ({ publicKey }) => publicKey === a.item
          );
          const itemB = allItems.data?.find(
            ({ publicKey }) => publicKey === b.item
          );

          if (!itemA || !itemB) {
            throw new Error('Matching item not found for order.');
          }

          return showNameAsc
            ? itemA.name.localeCompare(itemB.name)
            : itemB.name.localeCompare(itemA.name);
        });

      setSortedOrders(sortedOrders ?? []);
    }
  }, [allOrders, allItems, tabValue, searchValue, showNameAsc]);

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
            {tabs.map((tab) => (
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
                  <Button
                    size={'sm'}
                    variant={'ghost'}
                    onClick={() => setShowNameAsc(!showNameAsc)}
                  >
                    Item
                    {showNameAsc ? <ArrowDown /> : <ArrowUp />}
                  </Button>
                </TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Total</TableHead>
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
                    publicKey: pda,
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
                      <TableRow key={pda}>
                        <TableCell>
                          {/* @ts-expect-error status is a DecodeEnum but safely parsed as a string */}
                          <Badge className={`${statusColors[status]}`}>
                            {/* @ts-expect-error status is a DecodeEnum but safely parsed as a string */}
                            {capitalizeFirstLetter(status)}
                          </Badge>
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
                          <Button
                            asChild
                            size={'icon'}
                            type="button"
                            variant={'ghost'}
                            className="h-fit w-fit"
                          >
                            <Link href={getAccountLink(pda)} target="_blank">
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
          {sortedOrders && (
            <p className="muted-text text-sm">
              {sortedOrders.length} item(s) found.
            </p>
          )}
        </Tabs>
      ) : (
        <p className="my-auto">Connect your wallet</p>
      )}
    </section>
  );
}
