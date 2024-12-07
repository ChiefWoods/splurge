import { beforeAll, describe, expect, test } from "bun:test";
import {
  connection,
  getSplurgeConfigPdaAndBump,
  initializeConfig,
  masterWallet,
} from "../utils";

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
    const { splurgeConfigAcc } = await initializeConfig(masterWallet);

    const splurgeConfigBump = getSplurgeConfigPdaAndBump()[1];

    expect(splurgeConfigAcc.bump).toEqual(splurgeConfigBump);
    expect(splurgeConfigAcc.admin).toEqual(masterWallet.publicKey);
  });
});
