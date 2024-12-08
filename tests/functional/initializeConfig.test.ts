import { beforeAll, describe, expect, test } from "bun:test";
import {
  getBankrunSetup,
  getSplurgeConfigPdaAndBump,
  initializeConfig,
} from "../utils";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { Program } from "@coral-xyz/anchor";

describe("initializeConfig", () => {
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

  test("initializes a config", async () => {
    const whitelistedMints = [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ];

    const { splurgeConfigAcc } = await initializeConfig(
      program,
      payer,
      whitelistedMints,
    );

    const splurgeConfigBump = getSplurgeConfigPdaAndBump()[1];

    expect(splurgeConfigAcc.bump).toEqual(splurgeConfigBump);
    expect(splurgeConfigAcc.admin).toEqual(payer.publicKey);
    expect(splurgeConfigAcc.whitelistedMints).toEqual(whitelistedMints);
  });
});
