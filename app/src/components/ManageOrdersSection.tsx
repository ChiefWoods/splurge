'use client';

import {
  ParsedConfig,
  ParsedItem,
  ParsedOrder,
  ParsedShopper,
} from '@/types/accounts';
import { CommonSection } from './CommonSection';
import { UpdateOrderDialog } from './formDialogs/UpdateOrderDialog';
import { OrderTable } from './OrderTable';
import { SectionHeader } from './SectionHeader';
import { StatusBadge } from './StatusBadge';

export function ManageOrdersSection({
  items,
  orders,
  shoppers,
  config,
  storePda,
}: {
  items: ParsedItem[];
  orders: ParsedOrder[];
  shoppers: ParsedShopper[];
  config: ParsedConfig;
  storePda: string;
}) {
  return (
    <CommonSection className="items-start">
      <SectionHeader text="Manage Orders" />
      <OrderTable
        items={items}
        orders={orders}
        statusRenderer={(order) => {
          if (order.status === 'pending') {
            const orderItem = items.find(
              ({ publicKey }) => publicKey === order.item
            );

            if (!orderItem) {
              throw new Error('Matching item not found for order.');
            }

            const orderShopper = shoppers.find(
              ({ publicKey }) => publicKey === order.shopper
            );

            if (!orderShopper) {
              throw new Error('Matching shopper not found for order.');
            }

            return (
              <UpdateOrderDialog
                config={config}
                order={order}
                item={orderItem}
                shopper={orderShopper}
                storePda={storePda}
              />
            );
          } else {
            return <StatusBadge status={order.status} />;
          }
        }}
      />
    </CommonSection>
  );
}
