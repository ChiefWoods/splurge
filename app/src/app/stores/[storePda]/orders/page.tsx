'use client';

import { UpdateOrderDialog } from '@/components/formDialogs/UpdateOrderDialog';
import { StatusBadge } from '@/components/StatusBadge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ACCEPTED_MINTS_METADATA, ORDER_TABS } from '@/lib/constants';
import { getStorePda } from '@/lib/pda';
import { getAccountLink } from '@/lib/solana-helpers';
import { atomicToUsd, capitalizeFirstLetter } from '@/lib/utils';
import { useItem } from '@/providers/ItemProvider';
import { useOrder } from '@/providers/OrderProvider';
import { useShopper } from '@/providers/ShopperProvider';
import { useStore } from '@/providers/StoreProvider';
import { ParsedOrder } from '@/types/accounts';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowDown, ArrowUp, SquareArrowOutUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { publicKey } = useWallet();
  const router = useRouter();
  const { store } = useStore();
  const { allOrders } = useOrder();
  const { allItems } = useItem();
  const { allShoppers } = useShopper();
  const [sortedOrders, setSortedOrders] = useState<ParsedOrder[]>([]);
  const [tabValue, setTabValue] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [sortNameAsc, setSortNameAsc] = useState<boolean>(true);

  useEffect(() => {
    if (!publicKey) {
      router.replace('/');
    } else if (getStorePda(publicKey).toBase58() !== storePda) {
      router.replace('/');
    } else if (!store.isMutating && !store.data) {
      router.replace('/stores/create');
    }

    (async () => {
      await allOrders.trigger({
        storePda,
      });
      await allItems.trigger({ storePda });
      await allShoppers.trigger();
    })();
  }, [publicKey, router, storePda]);

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
        });

      setSortedOrders(sortedOrders ?? []);
    }
  }, [allOrders, allItems, tabValue, searchValue, sortNameAsc]);

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">Manage Orders</h2>
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
                  <Button
                    size={'sm'}
                    variant={'ghost'}
                    onClick={() => setSortNameAsc(!sortNameAsc)}
                  >
                    Item
                    {sortNameAsc ? <ArrowDown /> : <ArrowUp />}
                  </Button>
                </TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="flex items-center gap-2">Total</TableHead>
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
                    shopper,
                  }) => {
                    const orderItem = allItems.data?.find(
                      ({ publicKey }) => publicKey === item
                    );

                    if (!orderItem) {
                      throw new Error('Matching item not found for order.');
                    }

                    const orderShopper = allShoppers.data?.find(
                      ({ publicKey }) => publicKey === shopper
                    );

                    if (!orderShopper) {
                      throw new Error('Matching shopper not found for order.');
                    }

                    return (
                      <TableRow key={pda}>
                        <TableCell>
                          {/* @ts-expect-error status is a DecodeEnum but is actually a string */}
                          {status === 'pending' ? (
                            <UpdateOrderDialog
                              address={orderShopper.address}
                              amount={amount}
                              image={orderItem.image}
                              name={orderItem.name}
                              status={status}
                              orderPda={pda}
                            />
                          ) : (
                            // @ts-expect-error status is a DecodeEnum but is actually a string
                            <StatusBadge status={status} />
                          )}
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
