import { beforeAll, describe, expect, test } from "bun:test";
import {
  addWhitelistedMint,
  connection,
  initializeConfig,
  masterWallet,
} from "../utils";
import { PublicKey } from "@solana/web3.js";

// NOTE: Run against local validator

describe("addWhitelistedMint", () => {
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

  test("add whitelisted mints", async () => {
    const mints = [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];
    await initializeConfig(masterWallet, mints);

    const newMints = [
      new PublicKey("USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"),
      new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"),
    ];

    const { splurgeConfigAcc } = await addWhitelistedMint(
      masterWallet,
      newMints,
    );

    expect(splurgeConfigAcc.whitelistedMints).toEqual([...mints, ...newMints]);
  });
});
