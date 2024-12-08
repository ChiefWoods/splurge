import { beforeAll, describe, expect, test } from "bun:test";
import {
  getBankrunSetup,
  initializeConfig,
  removeWhitelistedMint,
} from "../utils";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { Program } from "@coral-xyz/anchor";

describe("removeWhitelistedMint", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  beforeAll(async () => {
    const bankrunSetup = await getBankrunSetup([]);

    context = bankrunSetup.context;
    banksClient = bankrunSetup.banksClient;
    payer = bankrunSetup.payer;
    provider = bankrunSetup.provider;
    program = bankrunSetup.program;
  });

  test("remove whitelisted mints", async () => {
    await initializeConfig(program, payer, [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ]);

    const mintsToRemove = [
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    const { splurgeConfigAcc } = await removeWhitelistedMint(
      program,
      payer,
      mintsToRemove,
    );

    mintsToRemove.forEach((mint) =>
      expect(splurgeConfigAcc.whitelistedMints).not.toContain(mint),
    );
  });

  test("throws if mint is not whitelisted", async () => {
    const mintsToRemove = [
      new PublicKey("USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"),
    ];

    try {
      await removeWhitelistedMint(program, payer, mintsToRemove);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.error.errorCode.code).toEqual("MintNotWhitelisted");
      expect(err.error.errorCode.number).toEqual(6004);
    }
  });
});
