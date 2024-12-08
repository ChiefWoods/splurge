import { beforeAll, describe, expect, test } from "bun:test";
import {
  addWhitelistedMint,
  getBankrunSetup,
  initializeConfig,
} from "../utils";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { AnchorError, Program } from "@coral-xyz/anchor";

describe("addWhitelistedMint", () => {
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

  test("add whitelisted mints", async () => {
    const mints = [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    await initializeConfig(program, payer, mints);

    const newMints = [
      new PublicKey("USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"),
      new PublicKey("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo"),
    ];

    const { splurgeConfigAcc } = await addWhitelistedMint(
      program,
      payer,
      newMints,
    );

    expect(splurgeConfigAcc.whitelistedMints).toEqual([...mints, ...newMints]);
  });

  test("throws if mint is already whitelisted", async () => {
    const newMints = [
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    try {
      await addWhitelistedMint(program, payer, newMints);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("MintAlreadyWhitelisted");
      expect(err.error.errorCode.number).toEqual(6003);
    }
  });
});
