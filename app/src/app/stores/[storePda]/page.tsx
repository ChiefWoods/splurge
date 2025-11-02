'use client';

import { AccountSection } from '@/components/AccountSection';
import { AccountSectionButtonTab } from '@/components/AccountSectionButtonTab';
import { AccountSectionSkeleton } from '@/components/AccountSectionSkeleton';
import { AddItemDialog } from '@/components/formDialogs/AddItemDialog';
import { CheckoutDialog } from '@/components/formDialogs/CheckoutDialog';
import { DeleteItemDialog } from '@/components/formDialogs/DeleteItemDialog';
import { UpdateItemDialog } from '@/components/formDialogs/UpdateItemDialog';
import { NoResultText } from '@/components/NoResultText';
import { ItemCard } from '@/components/ItemCard';
import { ItemCardSkeleton } from '@/components/ItemCardSkeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/providers/StoreProvider';
import { CircleDollarSign, ClipboardList, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { atomicToUsd } from '@/lib/utils';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { useItems } from '@/providers/ItemsProvider';
import { SectionHeader } from '@/components/SectionHeader';
import { MainSection } from '@/components/MainSection';
import { useProgram } from '@/providers/ProgramProvider';

export default function Page() {
  const { storePda } = useParams<{ storePda: string }>();
  const { publicKey } = useUnifiedWallet();
  const { splurgeClient } = useProgram();
  const { storeData, storeLoading } = useStore();
  const { itemsData, itemsLoading } = useItems();

  const buttons = [
    {
      href: `/stores/${storePda}/orders`,
      Icon: ClipboardList,
      text: 'Manage Orders',
    },
    {
      href: `/stores/${storePda}/earnings`,
      Icon: CircleDollarSign,
      text: 'View Earnings',
    },
  ];

  return (
    <MainSection className="flex-1">
      {storeLoading ? (
        <AccountSectionSkeleton />
      ) : (
        storeData && (
          <AccountSection
            key={storePda}
            title={storeData.name}
            image={storeData.image}
            prefix="Store ID:"
            address={storePda}
            content={<p>{storeData.about}</p>}
            buttons={
              publicKey &&
              storeData.publicKey ===
                splurgeClient.getStorePda(publicKey).toBase58() && (
                <AccountSectionButtonTab>
                  <AddItemDialog storePda={storePda} />
                  {buttons.map(({ href, Icon, text }) => (
                    <Button key={href} asChild size={'sm'}>
                      <Link href={href}>
                        <Icon />
                        {text}
                      </Link>
                    </Button>
                  ))}
                </AccountSectionButtonTab>
              )
            }
          />
        )
      )}
      {storeLoading && storeData && <Separator />}
      <section className="flex w-full flex-1 flex-col flex-wrap items-start gap-6">
        <SectionHeader text="Store Items" />
        <div className="flex w-full flex-1 flex-wrap gap-6">
          {itemsLoading || storeLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </>
          ) : itemsData?.length ? (
            itemsData.map(
              ({
                publicKey: pda,
                name,
                image,
                description,
                inventoryCount,
                price,
              }) =>
                storeData && (
                  <ItemCard
                    key={pda}
                    itemPda={pda}
                    itemName={name}
                    itemImage={image}
                    storePda={storePda}
                  >
                    <>
                      <div className="flex w-full flex-col justify-between overflow-hidden">
                        <p>{atomicToUsd(price)} USD</p>
                        <p>{inventoryCount} left</p>
                      </div>
                      {publicKey &&
                      storeData.publicKey ===
                        splurgeClient.getStorePda(publicKey).toBase58() ? (
                        <div className="flex items-end gap-x-2">
                          <UpdateItemDialog
                            name={name}
                            image={image}
                            description={description}
                            price={price}
                            inventoryCount={inventoryCount}
                            itemPda={pda}
                            storePda={storePda}
                          />
                          <DeleteItemDialog
                            name={name}
                            itemPda={pda}
                            storePda={storePda}
                          />
                        </div>
                      ) : (
                        inventoryCount > 0 && (
                          <CheckoutDialog
                            name={name}
                            image={image}
                            price={price}
                            maxAmount={inventoryCount}
                            storePda={storePda}
                            storeAuthority={storeData.authority}
                            itemPda={pda}
                            btnVariant="default"
                            btnSize="icon"
                          >
                            <ShoppingCart />
                          </CheckoutDialog>
                        )
                      )}
                    </>
                  </ItemCard>
                )
            )
          ) : (
            <NoResultText text="No items listed." />
          )}
        </div>
      </section>
    </MainSection>
  );
}
