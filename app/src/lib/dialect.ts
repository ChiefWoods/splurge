'use server';

import {
  NodeDialectSolanaWalletAdapter,
  Solana,
  SolanaSdkFactory,
} from '@dialectlabs/blockchain-sdk-solana';
import {
  AddressType,
  DappMessageActionType,
  Dialect,
  DialectCloudEnvironment,
  DialectSdk,
} from '@dialectlabs/sdk';
import { getStorePda } from './pda';
import { PublicKey } from '@solana/web3.js';
import { truncateAddress } from './utils';
import { OrderStatus, parseEnum } from '@/types/accounts';

const environment: DialectCloudEnvironment = 'production';

const sdk: DialectSdk<Solana> = Dialect.sdk(
  {
    environment,
  },
  SolanaSdkFactory.create({
    wallet: NodeDialectSolanaWalletAdapter.create(),
  })
);

const dapp = await sdk.dapps.find().then((dapp) => {
  if (!dapp) {
    throw new Error('Dapp not found. Please register your app first.');
  }

  return dapp;
});

export async function alertNewOrders({
  storeAuthority,
  shopperName,
  itemName,
  itemAmount,
  shopperAddress,
  paymentSubtotal,
  paymentMintSymbol,
}: {
  storeAuthority: string;
  shopperName: string;
  itemName: string;
  itemAmount: number;
  shopperAddress: string;
  paymentSubtotal: string;
  paymentMintSymbol: string;
}) {
  await dapp.messages.send({
    title: `New Order`,
    message: `New order received from ${shopperName}.

Order Details:
  - Item: ${itemName}
  - Amount: ${itemAmount}
  - Ship To: ${shopperAddress}
  - Payment Subtotal: ${paymentSubtotal}
  - Paid In: ${paymentMintSymbol}
  - Order Date: ${new Date().toUTCString()}

View and manage your orders in your dashboard.`,
    recipient: storeAuthority,
    notificationTypeId: 'e23cf8d3-853a-4686-9787-57d74d5427f8',
    addressTypes: [AddressType.Wallet, AddressType.Email, AddressType.Telegram],
    actionsV2: {
      type: DappMessageActionType.LINK,
      links: [
        {
          label: 'View Order',
          url: `${process.env.FRONTEND_BASE_URL}/stores/${getStorePda(new PublicKey(storeAuthority)).toBase58()}/orders`,
        },
      ],
    },
  });
}

export async function alertOutOfStock({
  storeAuthority,
  itemName,
}: {
  storeAuthority: string;
  itemName: string;
}) {
  await dapp.messages.send({
    title: `Inventory Out of Stock`,
    message: `Your listed item ${itemName} is out of stock.

Update your inventory to continue receiving orders.`,
    recipient: storeAuthority,
    notificationTypeId: '65b96ab6-49be-4456-b4c7-8736864e27af',
    addressTypes: [AddressType.Wallet, AddressType.Email, AddressType.Telegram],
    actionsV2: {
      type: DappMessageActionType.LINK,
      links: [
        {
          label: 'Update Inventory',
          url: `${process.env.FRONTEND_BASE_URL}/stores/${getStorePda(new PublicKey(storeAuthority)).toBase58()}`,
        },
      ],
    },
  });
}

export async function alertOrderUpdate({
  shopperAuthority,
  orderPda,
  itemName,
  itemAmount,
  storeName,
  paymentSubtotal,
  paymentMintSymbol,
  orderTimestamp,
  status,
}: {
  shopperAuthority: string;
  orderPda: string;
  itemName: string;
  itemAmount: number;
  storeName: string;
  paymentSubtotal: string;
  paymentMintSymbol: string;
  orderTimestamp: number;
  status: OrderStatus;
}) {
  const parsedStatus = parseEnum(status);
  const titleEnding =
    parsedStatus === 'shipping'
      ? 'Shipped'
      : parsedStatus === 'cancelled'
        ? 'Cancelled'
        : 'Completed';
  const headerEnding =
    parsedStatus === 'shipping'
      ? 'being shipped'
      : parsedStatus === 'cancelled'
        ? 'cancelled'
        : 'completed';

  await dapp.messages.send({
    title: `Order ${titleEnding}`,
    message: `Your order ${truncateAddress(orderPda)} is ${headerEnding}.

Order Details:
  - Item: ${itemName}
  - Amount: ${itemAmount}
  - Store: ${storeName}
  - Payment Subtotal: $${paymentSubtotal}
  - Paid In: ${paymentMintSymbol}
  - Order Date: ${new Date(orderTimestamp * 1000).toUTCString()}

Track your orders in your dashboard.`,
    recipient: shopperAuthority,
    notificationTypeId: '481ecda0-6845-4ad6-9f88-bb5d08c6b92f',
    addressTypes: [AddressType.Wallet, AddressType.Email, AddressType.Telegram],
    actionsV2: {
      type: DappMessageActionType.LINK,
      links: [
        {
          label: 'Track Orders',
          url: `${process.env.FRONTEND_BASE_URL}/orders/`,
        },
      ],
    },
  });
}
