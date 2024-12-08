import { beforeAll, describe, expect, test } from "bun:test";
import {
  connection,
  initializeConfig,
  masterWallet,
  removeWhitelistedMint,
} from "../utils";
import { PublicKey } from "@solana/web3.js";

// NOTE: Run against local validator

describe("removeWhitelistedMint", () => {
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

  test("remove whitelisted mints", async () => {
    await initializeConfig(masterWallet, [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ]);

    const mintsToRemove = [
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    const { splurgeConfigAcc } = await removeWhitelistedMint(
      masterWallet,
      mintsToRemove,
    );

    mintsToRemove.forEach((mint) =>
      expect(splurgeConfigAcc.whitelistedMints).not.toContain(mint),
    );
  });
});
