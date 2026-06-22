import { beforeEach, describe, expect, test } from "bun:test";

import { Keypair, SystemProgram } from "@solana/web3.js";
import {
  createInitializeConfigInstruction,
  createInitializeStoreInstruction,
  createListItemInstruction,
  createUnlistItemInstruction,
  findItemPda,
  findStorePda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVM } from "litesvm";

import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { fundedSystemAccountInfo, getSetup, sendTransaction } from "../setup";

describe("unlistItem", () => {
  let { litesvm, provider } = {} as {
    litesvm: LiteSVM;
    provider: Awaited<ReturnType<typeof getSetup>>["provider"];
  };

  const [admin, storeAuthority] = Array.from({ length: 2 }, Keypair.generate);

  const itemName = "Item A";

  beforeEach(async () => {
    ({ litesvm, provider } = await getSetup(
      [admin, storeAuthority].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(),
        };
      }),
    ));

    await sendTransaction(
      provider,

      [
        createInitializeConfigInstruction(
          {
            authority: admin.publicKey,
            systemProgram: SystemProgram.programId,
          },
          {
            acceptedMints: [
              {
                mint: USDC_MINT,
                priceUpdateV2: USDC_PRICE_UPDATE_V2,
              },
            ],
            admin: admin.publicKey,
            orderFeeBps: 250,
          },
        ),
      ],

      [admin],
    );

    await sendTransaction(
      provider,

      [
        createInitializeStoreInstruction(
          {
            authority: storeAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          },
          {
            name: "Store A",
            image: "https://example.com/image.png",
            about: "about",
          },
        ),
      ],

      [storeAuthority],
    );

    await sendTransaction(
      provider,

      [
        createListItemInstruction(
          {
            authority: storeAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          },
          {
            price: 1_000_000n,
            inventoryCount: 10,
            name: itemName,
            image: "https://example.com/item.png",
            description: "description",
          },
        ),
      ],

      [storeAuthority],
    );
  });

  test("unlist an item", async () => {
    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];

    await sendTransaction(
      provider,

      [
        createUnlistItemInstruction({
          authority: storeAuthority.publicKey,
          store: storePda,
          item: itemPda,
          systemProgram: SystemProgram.programId,
        }),
      ],

      [storeAuthority],
    );

    const itemAccBal = litesvm.getBalance(itemPda);

    expect(itemAccBal).toBe(null);
  });
});
