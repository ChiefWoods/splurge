import { beforeEach, describe, expect, test } from "bun:test";

import { Keypair } from "@solana/web3.js";
import {
  createInitializeStoreInstruction,
  fetchStoreAccount,
  findStorePda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";

import { MAX_STORE_NAME_LEN } from "../constants";
import { expectAnchorError, fundedSystemAccountInfo, getSetup, sendTransaction } from "../setup";

describe("initializeStore", () => {
  let { provider, connection } = {} as {
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
  };

  const storeAuthority = Keypair.generate();

  beforeEach(async () => {
    ({ provider, connection } = await getSetup([
      {
        pubkey: storeAuthority.publicKey,
        account: fundedSystemAccountInfo(),
      },
    ]));
  });

  test("creates a store", async () => {
    const name = "Store A";
    const image = "https://example.com/image.png";
    const about = "about";

    await sendTransaction(
      provider,

      [
        createInitializeStoreInstruction(
          {
            authority: storeAuthority.publicKey,
          },
          {
            name,
            image,
            about,
          },
        ),
      ],

      [storeAuthority],
    );

    const storePda = findStorePda({ authority: storeAuthority.publicKey }, SPLURGE_PROGRAM_ID)[0];
    const storeAcc = (await fetchStoreAccount(connection, storePda)).data;

    expect(storeAcc.name).toBe(name);
    expect(storeAcc.image).toBe(image);
    expect(storeAcc.about).toBe(about);
    expect(storeAcc.authority).toStrictEqual(storeAuthority.publicKey);
  });

  test("throws when name is empty", async () => {
    const name = "";
    const image = "https://example.com/image.png";
    const about = "about";

    try {
      await sendTransaction(
        provider,

        [
          createInitializeStoreInstruction(
            {
              authority: storeAuthority.publicKey,
            },
            {
              name,
              image,
              about,
            },
          ),
        ],

        [storeAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "StoreNameRequired");
    }
  });

  test("throws when name is too long", async () => {
    const name = "a".repeat(MAX_STORE_NAME_LEN + 1);
    const image = "https://example.com/image.png";
    const about = "about";

    try {
      await sendTransaction(
        provider,

        [
          createInitializeStoreInstruction(
            {
              authority: storeAuthority.publicKey,
            },
            {
              name,
              image,
              about,
            },
          ),
        ],

        [storeAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "StoreNameTooLong");
    }
  });

  test("throws when image is empty", async () => {
    const name = "Store A";
    const image = "";
    const about = "about";

    try {
      await sendTransaction(
        provider,

        [
          createInitializeStoreInstruction(
            {
              authority: storeAuthority.publicKey,
            },
            {
              name,
              image,
              about,
            },
          ),
        ],

        [storeAuthority],
      );
    } catch (err) {
      await expectAnchorError(err, "StoreImageRequired");
    }
  });
});
