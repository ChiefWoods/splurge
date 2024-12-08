import { beforeAll, describe, expect, test } from "bun:test";
import {
  addItem,
  createStore,
  getBankrunSetup,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
} from "../utils";
import { Keypair } from "@solana/web3.js";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { AnchorError, Program } from "@coral-xyz/anchor";

describe("addItem", () => {
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

    await createStore(
      program,
      "Store A",
      "https://example.com/image.png",
      "This is a description",
      payer,
    );
  });

  test("add item", async () => {
    const name = "Store Item A";
    const image = "https://example.com/item.png";
    const inventoryCount = 10;
    const price = 5.55;

    const { storeItemAcc, storeAcc } = await addItem(
      program,
      name,
      image,
      inventoryCount,
      price,
      payer,
    );

    const [storePda] = getStorePdaAndBump(payer.publicKey);
    const [storeItemPda, storeItemBump] = getStoreItemPdaAndBump(
      storePda,
      name,
    );

    expect(storeItemAcc.bump).toEqual(storeItemBump);
    expect(storeItemAcc.inventoryCount.toNumber()).toEqual(inventoryCount);
    expect(storeItemAcc.price).toEqual(price);
    expect(storeItemAcc.store).toEqual(storePda);
    expect(storeItemAcc.name).toEqual(name);
    expect(storeItemAcc.image).toEqual(image);
    expect(storeItemAcc.reviews).toEqual([]);
    expect(storeAcc.items[0]).toEqual(storeItemPda);
  });

  test("throws if item name is empty", async () => {
    try {
      await addItem(
        program,
        "",
        "https://example.com/item.png",
        10,
        5.55,
        payer,
      );
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("StoreItemNameRequired");
      expect(err.error.errorCode.number).toEqual(6300);
    }
  });

  test("throws if item name is too long", async () => {
    const storeItemNameMaxLength = 64;

    expect(async () => {
      await addItem(
        program,
        "_".repeat(storeItemNameMaxLength + 1),
        "https://example.com/item.png",
        10,
        5.55,
        payer,
      );
    }).toThrow();
  });

  test("throws if item image is empty", async () => {
    try {
      await addItem(program, "Store Item B", "", 10, 5.55, payer);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("StoreItemImageRequired");
      expect(err.error.errorCode.number).toEqual(6302);
    }
  });
});
