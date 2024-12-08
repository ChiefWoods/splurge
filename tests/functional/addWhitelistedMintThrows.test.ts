import { beforeAll, describe, expect, test } from "bun:test";
import {
  addWhitelistedMint,
  connection,
  initializeConfig,
  masterWallet,
} from "../utils";
import { PublicKey } from "@solana/web3.js";
import { AnchorError } from "@coral-xyz/anchor";

// NOTE: Run against local validator

describe("addWhitelistedMintThrows", () => {
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

  test("throws if mint is already whitelisted", async () => {
    await initializeConfig(masterWallet, [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ]);

    const newMints = [
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    try {
      await addWhitelistedMint(masterWallet, newMints);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("MintAlreadyWhitelisted");
      expect(err.error.errorCode.number).toEqual(6003);
    }
  });
});
