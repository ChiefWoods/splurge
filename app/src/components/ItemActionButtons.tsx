'use client';

import { ParsedConfig, ParsedItem, ParsedStore } from '@/types/accounts';
import { DeleteItemDialog } from './formDialogs/DeleteItemDialog';
import { UpdateItemDialog } from './formDialogs/UpdateItemDialog';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { CheckoutDialog } from './formDialogs/CheckoutDialog';
import { ShoppingCart } from 'lucide-react';

export function ItemActionButtons({
  item,
  store,
  config,
}: {
  item: ParsedItem;
  store: ParsedStore;
  config: ParsedConfig;
}) {
  const { publicKey } = useUnifiedWallet();

  return publicKey?.toBase58() === store.authority ? (
    <div className="flex items-end gap-x-2">
      <UpdateItemDialog item={item} storePda={store.publicKey} />
      <DeleteItemDialog item={item} storePda={store.publicKey} />
    </div>
  ) : (
    item.inventoryCount > 0 && (
      <CheckoutDialog
        config={config}
        item={item}
        store={store}
        btnVariant="default"
        btnSize="icon"
      >
        <ShoppingCart />
      </CheckoutDialog>
    )
  );
}
