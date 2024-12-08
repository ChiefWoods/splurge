import { beforeAll, describe, expect, test } from "bun:test";
import {
  connection,
  getSplurgeConfigPdaAndBump,
  initializeConfig,
  masterWallet,
} from "../utils";
import { PublicKey } from "@solana/web3.js";

// NOTE: Run against local validator

describe("initializeConfig", () => {
  beforeAll(async () => {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: await connection.requestAirdrop(
        masterWallet.publicKey,
        5_000_000_000,
      ),
    });
  });

  test("initializes a config", async () => {
    const whitelistedMints = [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    const { splurgeConfigAcc } = await initializeConfig(
      masterWallet,
      whitelistedMints,
    );

    const splurgeConfigBump = getSplurgeConfigPdaAndBump()[1];

    expect(splurgeConfigAcc.bump).toEqual(splurgeConfigBump);
    expect(splurgeConfigAcc.admin).toEqual(masterWallet.publicKey);
    expect(splurgeConfigAcc.whitelistedMints).toEqual(whitelistedMints);
  });
});
