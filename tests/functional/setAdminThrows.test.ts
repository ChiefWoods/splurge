import { beforeAll, describe, expect, test } from "bun:test";
import { connection, initializeConfig, masterWallet, setAdmin } from "../utils";
import { AnchorError } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// NOTE: Run against local validator

describe("setAdminThrows", () => {
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

  test("throws if updating config to same admin", async () => {
    await initializeConfig(masterWallet, [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ]);

    try {
      await setAdmin(masterWallet, masterWallet);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("AdminAlreadyAssigned");
      expect(err.error.errorCode.number).toEqual(6002);
    }
  });
});
