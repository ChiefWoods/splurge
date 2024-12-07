import { AnchorError, Program } from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import { beforeAll, describe, expect, test } from "bun:test";
import { BanksClient, ProgramTestContext, startAnchor } from "solana-bankrun";
import { Splurge } from "../../target/types/splurge";
import idl from "../../target/idl/splurge.json";
import { createStore, getStorePdaAndBump } from "../utils";

describe("createStore", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  const walletA = Keypair.generate();
  const walletB = Keypair.generate();

  beforeAll(async () => {
    context = await startAnchor(
      "",
      [],
      [
        {
          address: walletA.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: 5_000_000_000,
            owner: SystemProgram.programId,
          },
        },
        {
          address: walletB.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: 5_000_000_000,
            owner: SystemProgram.programId,
          },
        },
      ],
    );

    banksClient = context.banksClient;
    payer = context.payer;
    provider = new BankrunProvider(context);
    program = new Program(idl as Splurge, provider);
  });

  test("creates a store account", async () => {
    const name = "Store A";
    const image = "https://example.com/image.png";

    const { storeAcc } = await createStore(program, name, image, walletA);

    const shopperBump = getStorePdaAndBump(walletA.publicKey)[1];

    expect(storeAcc.bump).toEqual(shopperBump);
    expect(storeAcc.name).toEqual(name);
    expect(storeAcc.image).toEqual(image);
    expect(storeAcc.items).toEqual([]);
  });

  test("throws when name is empty", async () => {
    try {
      await createStore(program, "", "https://example.com/image.png", walletB);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("StoreNameRequired");
      expect(err.error.errorCode.number).toEqual(6200);
    }
  });

  test("throws when name is too long", async () => {
    const storeNameMaxLength = 64;

    expect(async () => {
      await createStore(
        program,
        "_".repeat(storeNameMaxLength + 1),
        "https://example.com/image.png",
        walletB,
      );
    }).toThrow();
  });

  test("throws when image is empty", async () => {
    try {
      await createStore(program, "Store B", "", walletB);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("StoreImageRequired");
      expect(err.error.errorCode.number).toEqual(6202);
    }
  });
});
