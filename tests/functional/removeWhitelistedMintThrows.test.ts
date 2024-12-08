import { beforeAll, describe, expect, test } from "bun:test";
import {
  connection,
  initializeConfig,
  masterWallet,
  removeWhitelistedMint,
} from "../utils";
import { PublicKey } from "@solana/web3.js";

// NOTE: Run against local validator

describe("removeWhitelistedMintThrows", () => {
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

  test("throws if mint is not whitelisted", async () => {
    await initializeConfig(masterWallet, [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ]);

    const mintsToRemove = [
      new PublicKey("USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"),
    ];

    try {
      await removeWhitelistedMint(masterWallet, mintsToRemove);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.error.errorCode.code).toEqual("MintNotWhitelisted");
      expect(err.error.errorCode.number).toEqual(6004);
    }
  });
});
