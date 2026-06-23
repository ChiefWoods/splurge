import { beforeEach, describe, expect, test } from "bun:test";

import { Keypair } from "@solana/web3.js";
import {
  createInitializeConfigInstruction,
  createInitializeStoreInstruction,
  createListItemInstruction,
  fetchItemAccount,
  findItemPda,
  findStorePda,
  MAX_ITEM_NAME_LEN,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";

import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { expectAnchorError, fundedSystemAccountInfo, getSetup, sendTransaction } from "../setup";

describe("listItem", () => {
  let { provider, connection } = {} as {
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
  };

  const [admin, storeAuthority] = Array.from({ length: 2 }, Keypair.generate);

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
  });

  test("list an item", async () => {
    const price = 1e6; // $1
    const inventoryCount = 10;
    const name = "Item A";
    const image = "https://example.com/item.png";
    const description = "description";

    await sendTransaction(
      provider,

      [
        createListItemInstruction(
          {
            authority: storeAuthority.publicKey,
          },
          {
            price: BigInt(price),
            inventoryCount,
            name,
            image,
            description,
          },
        ),
      ],

      [storeAuthority],
    );

    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const itemPda = findItemPda({ store: storePda, name: name }, SPLURGE_PROGRAM_ID)[0];
    const itemAcc = (await fetchItemAccount(connection, itemPda)).data;

    expect(itemAcc.store).toStrictEqual(storePda);
    expect(Number(itemAcc.price)).toBe(price);
    expect(itemAcc.inventoryCount).toBe(inventoryCount);
    expect(itemAcc.name).toBe(name);
    expect(itemAcc.image).toBe(image);
    expect(itemAcc.description).toBe(description);
  });

  test("throws if item name is empty", async () => {
    const price = 1e6; // $1
    const inventoryCount = 10;
    const name = "";
    const image = "https://example.com/item.png";
    const description = "description";

    try {
      await sendTransaction(
        provider,

        [
          createListItemInstruction(
            {
              authority: storeAuthority.publicKey,
            },
            {
              price: BigInt(price),
              inventoryCount,
              name,
              image,
              description,
            },
          ),
        ],

        [storeAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "ItemNameRequired");
    }
  });

  test("throws if item name is too long", async () => {
    const price = 1e6; // $1
    const inventoryCount = 10;
    const name = "_".repeat(MAX_ITEM_NAME_LEN + 1);
    const image = "https://example.com/item.png";
    const description = "description";

    expect(async () => {
      await sendTransaction(
        provider,

        [
          createListItemInstruction(
            {
              authority: storeAuthority.publicKey,
            },
            {
              price: BigInt(price),
              inventoryCount,
              name,
              image,
              description,
            },
          ),
        ],

        [storeAuthority],
      );
    }).toThrow();
  });
});
