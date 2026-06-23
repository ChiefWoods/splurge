import { beforeEach, describe, expect, test } from "bun:test";

import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createInitializeConfigInstruction,
  fetchConfigAccount,
  findConfigPda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";

import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { expectAnchorError, fundedSystemAccountInfo, getSetup, sendTransaction } from "../setup";

describe("initializeConfig", () => {
  let { provider, connection } = {} as {
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
  };

  const admin = Keypair.generate();

  beforeEach(async () => {
    ({ provider, connection } = await getSetup([
      {
        pubkey: admin.publicKey,
        account: fundedSystemAccountInfo(),
      },
    ]));
  });

  test("initializes a config", async () => {
    const acceptedMints = [
      {
        mint: USDC_MINT,
        priceUpdateV2: USDC_PRICE_UPDATE_V2,
      },
    ];
    const orderFeeBps = 250;

    await sendTransaction(
      provider,

      [
        createInitializeConfigInstruction(
          {
            authority: admin.publicKey,
          },
          {
            acceptedMints,
            admin: admin.publicKey,
            orderFeeBps,
          },
        ),
      ],

      [admin],
    );

    const configPda = findConfigPda(SPLURGE_PROGRAM_ID)[0];
    const configAcc = (await fetchConfigAccount(connection, configPda)).data;

    expect(configAcc.admin).toStrictEqual(admin.publicKey);
    expect(configAcc.isPaused).toBe(false);
    expect(configAcc.orderFeeBps).toBe(orderFeeBps);
    expect(configAcc.acceptedMints).toStrictEqual(acceptedMints);
  });

  test("throws if a mint is default PublicKey", async () => {
    const acceptedMints = [
      {
        mint: PublicKey.default,
        priceUpdateV2: USDC_PRICE_UPDATE_V2,
      },
    ];

    try {
      await sendTransaction(
        provider,

        [
          createInitializeConfigInstruction(
            {
              authority: admin.publicKey,
            },
            {
              acceptedMints,
              admin: admin.publicKey,
              orderFeeBps: 250,
            },
          ),
        ],

        [admin],
      );
    } catch (err) {
      await expectAnchorError(err, "InvalidAddress");
    }
  });

  test("throws if whitelist is empty", async () => {
    const acceptedMints = [];

    try {
      await sendTransaction(
        provider,

        [
          createInitializeConfigInstruction(
            {
              authority: admin.publicKey,
            },
            {
              acceptedMints,
              admin: admin.publicKey,
              orderFeeBps: 250,
            },
          ),
        ],

        [admin],
      );
    } catch (err) {
      await expectAnchorError(err, "EmptyAcceptedMints");
    }
  });
});
