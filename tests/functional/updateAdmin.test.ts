import { beforeAll, describe, expect, test } from "bun:test";
import { getFundedKeypair, masterWallet, updateAdmin } from "../utils";
import { Keypair } from "@solana/web3.js";

// NOTE: Run against local validator

describe("updateAdmin", () => {
  let newAdmin: Keypair;

  beforeAll(async () => {
    newAdmin = await getFundedKeypair();
  });

  test("updates config admin", async () => {
    const { splurgeConfigAcc } = await updateAdmin(masterWallet, newAdmin);

    expect(splurgeConfigAcc.admin).toEqual(newAdmin.publicKey);
  });
});
