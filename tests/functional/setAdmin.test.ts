import { beforeAll, describe, expect, test } from "bun:test";
import {
  connection,
  getFundedKeypair,
  initializeConfig,
  masterWallet,
  setAdmin,
} from "../utils";
import { Keypair, PublicKey } from "@solana/web3.js";

// NOTE: Run against local validator

describe("setAdmin", () => {
  let newAdmin: Keypair;

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

    newAdmin = await getFundedKeypair();
  });

  test("set config admin", async () => {
    await initializeConfig(masterWallet, [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ]);

    const { splurgeConfigAcc } = await setAdmin(masterWallet, newAdmin);

    expect(splurgeConfigAcc.admin).toEqual(newAdmin.publicKey);
  });
});
