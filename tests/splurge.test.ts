import { beforeAll, describe } from "bun:test";
import { Program, web3 } from "@coral-xyz/anchor";
import { ProgramTestContext, startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import idl from "../target/idl/splurge.json";
import { Splurge } from "../target/types/splurge";

describe("splurge", () => {
  let context: ProgramTestContext;
  let provider: BankrunProvider;
  let payer: web3.Keypair;
  let program: Program<Splurge>;

  beforeAll(async () => {
    context = await startAnchor("", [], []);
    provider = new BankrunProvider(context);
    payer = context.payer;
    program = new Program(idl as Splurge, provider);
  })
})