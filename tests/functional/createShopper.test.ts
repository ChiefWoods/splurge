import { AnchorError, Program } from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import { beforeAll, describe, expect, test } from "bun:test";
import { BanksClient, ProgramTestContext, startAnchor } from "solana-bankrun";
import { Splurge } from "../../target/types/splurge";
import idl from "../../target/idl/splurge.json";
import { createShopper, getShopperPdaAndBump } from "../utils";

describe("createShopper", () => {
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

  test("creates a shopper account", async () => {
    const name = "Shopper A";
    const image = "https://example.com/image.png";

    const { shopperAcc } = await createShopper(program, name, image, walletA);

    const shopperBump = getShopperPdaAndBump(walletA.publicKey)[1];

    expect(shopperAcc.bump).toEqual(shopperBump);
    expect(shopperAcc.name).toEqual(name);
    expect(shopperAcc.image).toEqual(image);
    expect(shopperAcc.orders).toEqual([]);
  });

  test("throws when name is empty", async () => {
    try {
      await createShopper(
        program,
        "",
        "https://example.com/image.png",
        walletB,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("ShopperNameRequired");
      expect(err.error.errorCode.number).toEqual(6100);
    }
  });

  test("throws when name is too long", async () => {
    const shopperNameMaxLength = 64;

    try {
      await createShopper(
        program,
        "_".repeat(shopperNameMaxLength + 1),
        "https://example.com/image.png",
        walletB,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("ShopperNameTooLong");
      expect(err.error.errorCode.number).toEqual(6101);
    }
  });

  test("throws when image is empty", async () => {
    try {
      await createShopper(program, "Shopper B", "", walletB);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("ShopperImageRequired");
      expect(err.error.errorCode.number).toEqual(6102);
    }
  });
});
