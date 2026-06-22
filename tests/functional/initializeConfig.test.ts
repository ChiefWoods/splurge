import { beforeEach, describe, expect, test } from "bun:test";

import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

import { Splurge } from "../../target/types/splurge";
import { fetchConfigAcc } from "../accounts";
import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { getConfigPda } from "../pda";
import { expectAnchorError, fundedSystemAccountInfo, getSetup } from "../setup";

describe("initializeConfig", () => {
  let { program } = {} as {
    program: Program<Splurge>;
  };

  const admin = Keypair.generate();

  beforeEach(async () => {
    ({ program } = await getSetup([
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

    await program.methods
      .initializeConfig({
        acceptedMints,
        admin: admin.publicKey,
        orderFeeBps,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const configPda = getConfigPda();
    const configAcc = await fetchConfigAcc(program, configPda);

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
      await program.methods
        .initializeConfig({
          acceptedMints,
          admin: admin.publicKey,
          orderFeeBps: 250,
        })
        .accounts({
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      expectAnchorError(err, "InvalidAddress");
    }
  });

  test("throws if whitelist is empty", async () => {
    const acceptedMints = [];

    try {
      await program.methods
        .initializeConfig({
          acceptedMints,
          admin: admin.publicKey,
          orderFeeBps: 250,
        })
        .accounts({
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      expectAnchorError(err, "EmptyAcceptedMints");
    }
  });
});
