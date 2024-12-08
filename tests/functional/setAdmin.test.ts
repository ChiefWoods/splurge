import { beforeAll, describe, expect, test } from "bun:test";
import { getBankrunSetup, initializeConfig, setAdmin } from "../utils";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { AnchorError, Program } from "@coral-xyz/anchor";

describe("setAdmin", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  const newAdmin = Keypair.generate();

  beforeAll(async () => {
    const bankrunSetup = await getBankrunSetup([
      {
        address: newAdmin.publicKey,
        info: {
          data: Buffer.alloc(0),
          executable: false,
          lamports: 5_000_000_000,
          owner: SystemProgram.programId,
        },
      },
    ]);

    context = bankrunSetup.context;
    banksClient = bankrunSetup.banksClient;
    payer = bankrunSetup.payer;
    provider = bankrunSetup.provider;
    program = bankrunSetup.program;
  });

  test("set config admin", async () => {
    await initializeConfig(program, payer, [
      new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
      new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    ]);

    const { splurgeConfigAcc } = await setAdmin(program, payer, newAdmin);

    expect(splurgeConfigAcc.admin).toEqual(newAdmin.publicKey);
  });

  test("throws if updating config to same admin", async () => {
    try {
      await setAdmin(program, newAdmin, newAdmin);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("AdminAlreadyAssigned");
      expect(err.error.errorCode.number).toEqual(6002);
    }
  });
});
