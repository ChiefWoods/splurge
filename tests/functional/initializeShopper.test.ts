import { beforeEach, describe, expect, test } from "bun:test";

import { Keypair } from "@solana/web3.js";
import {
  createInitializeShopperInstruction,
  fetchShopperAccount,
  findShopperPda,
  MAX_SHOPPER_NAME_LEN,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";

import { expectAnchorError, fundedSystemAccountInfo, getSetup, sendTransaction } from "../setup";

describe("initializeShopper", () => {
  let { provider, connection } = {} as {
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
  };

  const shopperAuthority = Keypair.generate();

  beforeEach(async () => {
    ({ provider, connection } = await getSetup([
      {
        pubkey: shopperAuthority.publicKey,
        account: fundedSystemAccountInfo(),
      },
    ]));
  });

  test("creates a shopper", async () => {
    const name = "Shopper A";
    const image = "https://example.com/image.png";
    const address = "address";

    await sendTransaction(
      provider,

      [
        createInitializeShopperInstruction(
          {
            authority: shopperAuthority.publicKey,
          },
          {
            name,
            image,
            address,
          },
        ),
      ],

      [shopperAuthority],
    );

    const shopperPda = findShopperPda(
      { authority: shopperAuthority.publicKey },
      SPLURGE_PROGRAM_ID,
    )[0];
    const shopperAcc = (await fetchShopperAccount(connection, shopperPda)).data;

    expect(shopperAcc.name).toBe(name);
    expect(shopperAcc.image).toBe(image);
    expect(shopperAcc.address).toBe(address);
    expect(shopperAcc.authority).toStrictEqual(shopperAuthority.publicKey);
  });

  test("throws when name is empty", async () => {
    const name = "";
    const image = "https://example.com/image.png";
    const address = "address";

    try {
      await sendTransaction(
        provider,

        [
          createInitializeShopperInstruction(
            {
              authority: shopperAuthority.publicKey,
            },
            {
              name,
              image,
              address,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "ShopperNameRequired");
    }
  });

  test("throws when name is too long", async () => {
    const name = "_".repeat(MAX_SHOPPER_NAME_LEN + 1);
    const image = "https://example.com/image.png";
    const address = "address";

    try {
      await sendTransaction(
        provider,

        [
          createInitializeShopperInstruction(
            {
              authority: shopperAuthority.publicKey,
            },
            {
              name,
              image,
              address,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "ShopperNameTooLong");
    }
  });

  test("throws when image is empty", async () => {
    const name = "Shopper A";
    const image = "";
    const address = "address";

    try {
      await sendTransaction(
        provider,

        [
          createInitializeShopperInstruction(
            {
              authority: shopperAuthority.publicKey,
            },
            {
              name,
              image,
              address,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "ShopperImageRequired");
    }
  });

  test("throws when address is empty", async () => {
    const name = "Shopper A";
    const image = "https://example.com/image.png";
    const address = "";

    try {
      await sendTransaction(
        provider,

        [
          createInitializeShopperInstruction(
            {
              authority: shopperAuthority.publicKey,
            },
            {
              name,
              image,
              address,
            },
          ),
        ],

        [shopperAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "ShopperAddressRequired");
    }
  });
});
