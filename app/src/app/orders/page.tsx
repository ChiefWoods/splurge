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
import { useAnchorProgram } from '@/hooks/useAnchorProgram';
import { WHITELISTED_PAYMENT_TOKENS } from '@/lib/constants';
import { getShopperPda } from '@/lib/pda';
import { capitalizeFirstLetter, getAccountLink } from '@/lib/utils';
import { Tabs } from '@radix-ui/react-tabs';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ArrowDown, ArrowUp, SquareArrowOutUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';

type SortedOrders = {
  pda: string;
  status: string;
  amount: number;
  totalUsd: number;
  paymentMint: string;
  storeItem: {
    pda: string;
    name: string;
    image: string;
  };
};

const statusColors: Record<string, string> = {
  pending: 'bg-pending hover:bg-pending',
  shipping: 'bg-shipping hover:bg-shipping',
  completed: 'bg-completed hover:bg-completed',
  cancelled: 'bg-cancelled hover:bg-cancelled',
};

const tabs = ['all', 'pending', 'shipping', 'completed', 'cancelled'];

export default function Page() {
  const { publicKey } = useWallet();
  const { getShopperAcc, getMultipleStoreItemAcc, getMultipleOrderAcc } =
    useAnchorProgram();
  const [tabValue, setTabValue] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  const [showNameAsc, setShowNameAsc] = useState<boolean>(true);
  const orders = useSWR(
    publicKey ? { url: '/api/orders', publicKey } : null,
    async ({ publicKey }) => {
      const shopper = await getShopperAcc(getShopperPda(publicKey));

      if (!shopper) {
        throw new Error('Shopper account not found.');
      }

      const storeItemSet = new Set<PublicKey>();
      const orders = (await getMultipleOrderAcc(shopper.orders))
        .map((order, i) => {
          if (!order) return;

          storeItemSet.add(order.storeItem);

          return {
            pda: shopper.orders[i].toBase58(),
            status: Object.keys(order.status)[0],
            itemPda: order.storeItem.toBase58(),
            amount: order.amount.toNumber(),
            totalUsd: order.totalUsd,
            paymentMint: order.paymentMint.toBase58(),
          };
        })
        .filter((orderAcc) => orderAcc !== null && orderAcc !== undefined);

      const storeItemArr = Array.from(storeItemSet);
      const storeItems = (await getMultipleStoreItemAcc(storeItemArr)).filter(
        (item) => item !== null
      );

      const storeItemMap = new Map(
        storeItems.map((item, i) => {
          return [
            storeItemArr[i].toBase58(),
            {
              pda: storeItemArr[i].toBase58(),
              name: item.name,
              image: item.image,
            },
          ];
        })
      );

      const ordersWithItems = orders
        .map(({ pda, status, itemPda, amount, totalUsd, paymentMint }) => {
          const storeItem = storeItemMap.get(itemPda);

          if (!storeItem) {
            throw new Error('Store item not found.');
          }

          return {
            pda,
            status,
            amount,
            totalUsd,
            storeItem,
            paymentMint,
          };
        })
        .filter((order) => order !== undefined);

      return ordersWithItems;
    }
  );
  const sortedOrders = useSWR(
    orders.data ? { orders: orders.data, tabValue, searchValue } : null,
    ({ orders, tabValue, searchValue }) => {
      return orders
        .filter((order) => {
          if (tabValue === 'all') {
            return true;
          } else {
            return (
              order.status === tabValue &&
              order.storeItem.name
                .toLowerCase()
                .includes(searchValue.toLowerCase())
            );
          }
        })
        .sort((a, b) => {
          return showNameAsc
            ? a.storeItem.name.localeCompare(b.storeItem.name)
            : b.storeItem.name.localeCompare(a.storeItem.name);
        });
    }
  );

  return (
    <section className="main-section flex-1">
      <h2 className="w-full text-start">My Orders</h2>
      {publicKey ? (
        orders.data && (
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
                  <TableHead className="w-[200px]">Status</TableHead>
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
                {sortedOrders.data?.length ? (
                  sortedOrders.data.map((order: SortedOrders) => (
                    <TableRow key={order.pda}>
                      <TableCell>
                        <Badge className={`${statusColors[order.status]}`}>
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-x-4">
                          <div className="h-12 w-12 rounded-lg border bg-[#f4f4f5] p-1">
                            <Image
                              src={order.storeItem.image}
                              alt={order.storeItem.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="text-md">
                            {order.storeItem.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-x-2">
                          <span>{order.totalUsd.toFixed(2)}</span>
                          <Image
                            src={
                              WHITELISTED_PAYMENT_TOKENS.find(
                                (token) => token.mint === order.paymentMint
                              )!.image
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
                          <Link
                            href={getAccountLink(order.pda)}
                            target="_blank"
                          >
                            <SquareArrowOutUpRight />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {sortedOrders.data && (
              <p className="muted-text text-sm">
                {sortedOrders.data.length} item(s) found.
              </p>
            )}
          </Tabs>
        )
      ) : (
        <p className="my-auto">Connect your Wallet</p>
      )}
    </section>
  );
}
