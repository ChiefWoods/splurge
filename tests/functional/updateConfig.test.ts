import { beforeEach, describe, expect, test } from "bun:test";

import { Keypair, SystemProgram } from "@solana/web3.js";
import {
  createInitializeConfigInstruction,
  createUpdateConfigInstruction,
  fetchConfigAccount,
  findConfigPda,
  SPLURGE_PROGRAM_ID,
} from "@splurge/sdk";
import { LiteSVMProvider } from "anchor-litesvm";

import { USDC_MINT, USDC_PRICE_UPDATE_V2, USDT_MINT, USDT_PRICE_UPDATE_V2 } from "../constants";
import { expectAnchorError, fundedSystemAccountInfo, getSetup, sendTransaction } from "../setup";

describe("updateConfig", () => {
  let { provider, connection } = {} as {
    provider: LiteSVMProvider;
    connection: LiteSVMProvider["connection"];
  };

  const [admin, newAdmin] = Array.from({ length: 2 }, Keypair.generate);

  let acceptedMints = [
    {
      mint: USDC_MINT,
      priceUpdateV2: USDC_PRICE_UPDATE_V2,
    },
  ];

  beforeEach(async () => {
    ({ provider, connection } = await getSetup(
      [admin, newAdmin].map((kp) => {
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
            acceptedMints,
            admin: admin.publicKey,
            orderFeeBps: 250,
          },
        ),
      ],

      [admin],
    );
  });

  test("updates a config", async () => {
    acceptedMints.push({
      mint: USDT_MINT,
      priceUpdateV2: USDT_PRICE_UPDATE_V2,
    });
    const isPaused = true;
    const orderFeeBps = 500;

    await sendTransaction(
      provider,

      [
        createUpdateConfigInstruction(
          {
            admin: admin.publicKey,
            systemProgram: SystemProgram.programId,
          },
          {
            acceptedMints,
            isPaused,
            newAdmin: newAdmin.publicKey,
            orderFeeBps,
          },
        ),
      ],

      [admin],
    );

    const configPda = findConfigPda(SPLURGE_PROGRAM_ID)[0];
    const configAcc = (await fetchConfigAccount(connection, configPda)).data;

    expect(configAcc.admin).toStrictEqual(newAdmin.publicKey);
    expect(configAcc.orderFeeBps).toBe(orderFeeBps);
    expect(configAcc.acceptedMints).toStrictEqual(acceptedMints);
  });

  test("throws if updating as unauthorized admin", async () => {
    acceptedMints.push({
      mint: USDT_MINT,
      priceUpdateV2: USDT_PRICE_UPDATE_V2,
    });
    const isPaused = true;
    const orderFeeBps = 500;

    try {
      await sendTransaction(
        provider,

        [
          createUpdateConfigInstruction(
            {
              admin: newAdmin.publicKey,
              systemProgram: SystemProgram.programId,
            },
            {
              acceptedMints,
              isPaused,
              newAdmin: newAdmin.publicKey,
              orderFeeBps,
            },
          ),
        ],

        [newAdmin],
      );
    } catch (err) {
      await expectAnchorError(err, "UnauthorizedAdmin");
    }
  });
});
