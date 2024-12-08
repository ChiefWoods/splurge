import { AnchorError, Program } from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import { beforeAll, describe, expect, test } from "bun:test";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { Splurge } from "../../target/types/splurge";
import { createStore, getBankrunSetup, updateStore } from "../utils";

describe("updateStore", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  const walletA = Keypair.generate();
  const walletB = Keypair.generate();
  const walletC = Keypair.generate();
  const walletD = Keypair.generate();

  beforeAll(async () => {
    // const bankrunSetup = await getBankrunSetup([
    //   {
    //     address: walletA.publicKey,
    //     info: {
    //       data: Buffer.alloc(0),
    //       executable: false,
    //       lamports: 5_000_000_000,
    //       owner: SystemProgram.programId,
    //     },
    //   },
    //   {
    //     address: walletB.publicKey,
    //     info: {
    //       data: Buffer.alloc(0),
    //       executable: false,
    //       lamports: 5_000_000_000,
    //       owner: SystemProgram.programId,
    //     },
    //   },
    //   {
    //     address: walletC.publicKey,
    //     info: {
    //       data: Buffer.alloc(0),
    //       executable: false,
    //       lamports: 5_000_000_000,
    //       owner: SystemProgram.programId,
    //     },
    //   },
    //   {
    //     address: walletD.publicKey,
    //     info: {
    //       data: Buffer.alloc(0),
    //       executable: false,
    //       lamports: 5_000_000_000,
    //       owner: SystemProgram.programId,
    //     },
    //   },
    // ]);

    const bankrunSetup = await getBankrunSetup(
      [walletA, walletB, walletC, walletD].map((wallet) => ({
        address: wallet.publicKey,
        info: {
          data: Buffer.alloc(0),
          executable: false,
          lamports: 5_000_000_000,
          owner: SystemProgram.programId,
        },
      })),
    );

    context = bankrunSetup.context;
    banksClient = bankrunSetup.banksClient;
    payer = bankrunSetup.payer;
    provider = bankrunSetup.provider;
    program = bankrunSetup.program;
  });

  test("updates a store account", async () => {
    await createStore(
      program,
      "Store A",
      "https://example.com/image.png",
      "This is a store",
      walletA,
    );

    const name = "New Store A";
    const image = "https://example.com/new-image.png";
    const about = "This is an updated store";

    const { storeAcc } = await updateStore(
      program,
      name,
      image,
      about,
      walletA,
    );

    expect(storeAcc.name).toEqual(name);
    expect(storeAcc.image).toEqual(image);
    expect(storeAcc.about).toEqual(about);
  });

  test("throws when name is empty", async () => {
    await createStore(
      program,
      "Store B",
      "https://example.com/image.png",
      "This is a store",
      walletB,
    );

    try {
      await updateStore(
        program,
        "",
        "https://example.com/new-image.png",
        "This is an updated store",
        walletB,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("StoreNameRequired");
      expect(err.error.errorCode.number).toEqual(6200);
    }
  });

  test("throws when name is too long", async () => {
    await createStore(
      program,
      "Store C",
      "https://example.com/image.png",
      "This is a store",
      walletC,
    );

    const storeNameMaxLength = 64;

    expect(async () => {
      await updateStore(
        program,
        "_".repeat(storeNameMaxLength + 1),
        "https://example.com/new-image.png",
        "This is an updated store",
        walletC,
      );
    }).toThrow();
  });

  test("throws when image is empty", async () => {
    await createStore(
      program,
      "Store D",
      "https://example.com/image.png",
      "This is a store",
      walletD,
    );

    try {
      await updateStore(
        program,
        "New Store D",
        "",
        "This is an updated store",
        walletD,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("StoreImageRequired");
      expect(err.error.errorCode.number).toEqual(6202);
    }
  });
});
