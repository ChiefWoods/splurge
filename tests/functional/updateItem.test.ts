import { beforeEach, describe, expect, test } from "bun:test";

import { Keypair, SystemProgram } from "@solana/web3.js";
import {
  createInitializeConfigInstruction,
  createInitializeStoreInstruction,
  createListItemInstruction,
  createUpdateItemInstruction,
  fetchItemAccount,
  findItemPda,
  findStorePda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";

import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { fundedSystemAccountInfo, getSetup, sendTransaction } from "../setup";

describe("updateItem", () => {
  let { provider, connection } = {} as {
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
  };

  const [admin, storeAuthority] = Array.from({ length: 2 }, Keypair.generate);

  const itemName = "Item A";

  beforeEach(async () => {
    ({ provider, connection } = await getSetup(
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

  test("updates an item", async () => {
    const price = 20e6; // $2
    const inventoryCount = 5;

    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const itemPda = findItemPda({ store: storePda, name: itemName }, SPLURGE_PROGRAM_ID)[0];

    await sendTransaction(
      provider,

      [
        createUpdateItemInstruction(
          {
            authority: storeAuthority.publicKey,
            store: storePda,
            item: itemPda,
          },
          {
            price: BigInt(price),
            inventoryCount,
          },
        ),
      ],

      [storeAuthority],
    );

    const itemAcc = (await fetchItemAccount(connection, itemPda)).data;

    expect(Number(itemAcc.price)).toBe(price);
    expect(itemAcc.inventoryCount).toBe(inventoryCount);
  });
});
