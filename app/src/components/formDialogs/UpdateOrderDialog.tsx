"use client";

import { nextAvailableTaskIds, taskKey, taskQueueAuthorityKey } from "@helium/tuktuk-sdk";
import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  createCancelOrderInstruction,
  createShipOrderInstruction,
  findShopperPda,
} from "@splurge/sdk";
import { Pencil, Truck, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useWalletAuth } from "@/hooks/useWalletAuth";
import { sendPermissionedTx } from "@/lib/api";
import { buildTx } from "@/lib/client/solana";
import { fetchTaskQueue, TASK_QUEUE, TUKTUK_PROGRAM_ID } from "@/lib/client/tuktuk";
import { ACCEPTED_MINTS_METADATA } from "@/lib/constants";
import { alertOrderUpdate } from "@/lib/server/dialect";
import { atomicToUsd, capitalizeFirstLetter, truncateAddress } from "@/lib/utils";
import { useOrders } from "@/providers/OrdersProvider";
import { useSettings } from "@/providers/SettingsProvider";
import { useStore } from "@/providers/StoreProvider";
import {
  ParsedConfig,
  ParsedItem,
  ParsedOrder,
  ParsedOrderStatus,
  ParsedShopper,
} from "@/types/accounts";

import { FormCancelButton } from "../FormCancelButton";
import { FormDialogContent } from "../FormDialogContent";
import { FormDialogFooter } from "../FormDialogFooter";
import { FormDialogTitle } from "../FormDialogTitle";
import { LargeImage } from "../LargeImage";
import { StatusBadge } from "../StatusBadge";
import { TransactionToast } from "../TransactionToast";
import { Button } from "../ui/button";
import { Dialog, DialogHeader, DialogTrigger } from "../ui/dialog";

export function UpdateOrderDialog({
  config,
  order,
  item,
  shopper,
  storePda,
}: {
  config: ParsedConfig;
  order: ParsedOrder;
  item: ParsedItem;
  shopper: ParsedShopper;
  storePda: string;
}) {
  const { connection } = useConnection();
  const { signMessage } = useUnifiedWallet();
  const { getTransactionLink, priorityFee } = useSettings();
  const { checkAuth } = useWalletAuth();
  const { storeData } = useStore();
  const { ordersMutate } = useOrders();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const onSubmit = useCallback(
    (status: ParsedOrderStatus) => {
      toast.promise(
        async () => {
          if (!signMessage) {
            throw new Error("Wallet not connected.");
          }

          if (!storeData) {
            throw new Error("Store account not created.");
          }

          setIsSubmitting(true);

          const admin = new PublicKey(config.data.admin);
          const authorityPubkey = new PublicKey(shopper.data.authority);
          const orderPdaPubkey = new PublicKey(order.address);
          const shopperPda = findShopperPda({ authority: authorityPubkey })[0];

          const paymentMintPubkey = new PublicKey(order.data.paymentMint);
          const mintAcc = await connection.getAccountInfo(paymentMintPubkey);

          if (!mintAcc) {
            throw new Error("Mint account not found.");
          }

          const tokenProgram = mintAcc.owner;

          const tx = await buildTx(
            connection,
            [
              status === "shipping"
                ? await (async () => {
                    const taskQueue = await fetchTaskQueue(connection);
                    const taskId = nextAvailableTaskIds(taskQueue.taskBitmap, 1, false)[0];
                    const [task] = taskKey(TASK_QUEUE, taskId, TUKTUK_PROGRAM_ID);
                    const [taskQueueAuthority] = taskQueueAuthorityKey(TASK_QUEUE, admin);
                    return createShipOrderInstruction(
                      {
                        admin,
                        order: orderPdaPubkey,
                        authority: authorityPubkey,
                        item: new PublicKey(item.address),
                        orderTokenAccount: getAssociatedTokenAddressSync(
                          paymentMintPubkey,
                          orderPdaPubkey,
                          true,
                          tokenProgram,
                        ),
                        paymentMint: paymentMintPubkey,
                        shopper: shopperPda,
                        store: new PublicKey(storePda),
                        tokenProgram,
                        tuktuk: TUKTUK_PROGRAM_ID,
                        taskQueue: TASK_QUEUE,
                        task,
                        taskQueueAuthority,
                      },
                      { taskId },
                    );
                  })()
                : createCancelOrderInstruction({
                    admin,
                    authority: authorityPubkey,
                    order: orderPdaPubkey,
                    paymentMint: paymentMintPubkey,
                    shopper: shopperPda,
                    tokenProgram,
                  }),
            ],
            admin,
            [],
            priorityFee,
          );

          await signMessage(
            new TextEncoder().encode(
              `Update order ${truncateAddress(order.address)} to '${capitalizeFirstLetter(status)}' status.`,
            ),
          );

          const signature = await sendPermissionedTx(tx);

          return {
            signature,
            storeName: storeData.data.name,
          };
        },
        {
          loading: "Waiting for signature...",
          success: async ({ signature, storeName }) => {
            await ordersMutate(
              (prev) => {
                if (!prev) {
                  throw new Error("Orders should not be null.");
                }

                return prev.map((prevOrder) => {
                  if (prevOrder.address === order.address) {
                    return {
                      ...prevOrder,
                      data: { ...prevOrder.data, status },
                    };
                  } else {
                    return prevOrder;
                  }
                });
              },
              {
                revalidate: true,
              },
            );

            setIsOpen(false);
            setIsSubmitting(false);

            const paymentMintSymbol = ACCEPTED_MINTS_METADATA.get(order.data.paymentMint)?.symbol;

            if (!paymentMintSymbol) {
              throw new Error("Payment mint not found.");
            }

            await alertOrderUpdate({
              itemAmount: order.data.amount,
              itemName: item.data.name,
              orderPda: order.address,
              orderTimestamp: order.data.timestamp,
              paymentMintSymbol,
              paymentSubtotal: atomicToUsd(order.data.paymentSubtotal),
              storeName,
              shopperAuthority: shopper.data.authority,
              status,
            });

            return <TransactionToast title="Order updated!" link={getTransactionLink(signature)} />;
          },
          error: (err) => {
            console.error(err);
            setIsSubmitting(false);
            return err.message || "Something went wrong.";
          },
        },
      );
    },
    [
      ordersMutate,
      connection,
      config,
      storeData,
      signMessage,
      storePda,
      getTransactionLink,
      priorityFee,
      shopper,
      order,
      item,
    ],
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <StatusBadge
          status={order.data.status}
          className="cursor-pointer"
          onClick={() => checkAuth(() => setIsOpen(true))}
        >
          <Pencil size={12} className="text-background" />
        </StatusBadge>
      </DialogTrigger>
      <FormDialogContent>
        <DialogHeader>
          <FormDialogTitle title="Update Order" />
        </DialogHeader>
        <section className="flex flex-col items-stretch gap-y-4">
          <LargeImage src={item.data.image} alt={item.data.name} />
          <div className="flex flex-col gap-2">
            <h3 className="truncate font-medium">{shopper.data.name}</h3>
            <p className="text-sm">Amount - {order.data.amount}</p>
            <p className="text-sm">{shopper.data.address}</p>
          </div>
          <FormDialogFooter>
            <FormCancelButton onClick={() => setIsOpen(false)} />
            <Button
              size={"sm"}
              onClick={() => onSubmit("shipping")}
              disabled={isSubmitting}
              className="bg-completed hover:bg-completed/90 transition-colors"
            >
              <Truck className="size-4" />
              Shipped
            </Button>
            <Button
              size={"sm"}
              onClick={() => onSubmit("cancelled")}
              disabled={isSubmitting}
              className="bg-cancelled hover:bg-cancelled/90 transition-colors"
            >
              <X className="size-4" />
              Reject
            </Button>
          </FormDialogFooter>
        </section>
      </FormDialogContent>
    </Dialog>
  );
}
