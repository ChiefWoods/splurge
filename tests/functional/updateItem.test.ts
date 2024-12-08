import { beforeAll, describe, expect, test } from "bun:test";
import { addItem, createStore, getBankrunSetup, updateItem } from "../utils";
import { Keypair } from "@solana/web3.js";
import { BanksClient, ProgramTestContext } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import { Splurge } from "../../target/types/splurge";
import { Program } from "@coral-xyz/anchor";

describe("updateItem", () => {
  let context: ProgramTestContext;
  let banksClient: BanksClient;
  let payer: Keypair;
  let provider: BankrunProvider;
  let program: Program<Splurge>;

  const itemName = "Store Item A";

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

    await addItem(
      program,
      itemName,
      "https://example.com/item.png",
      "This is a description",
      10,
      5.55,
      payer,
    );
  });

  test("update item", async () => {
    const inventoryCount = 5;
    const price = 8.95;

    const { storeItemAcc } = await updateItem(
      program,
      itemName,
      inventoryCount,
      price,
      payer,
    );

    expect(storeItemAcc.inventoryCount.toNumber()).toEqual(inventoryCount);
    expect(storeItemAcc.price).toEqual(price);
  });
});
