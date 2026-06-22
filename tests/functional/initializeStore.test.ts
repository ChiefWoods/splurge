import { beforeEach, describe, expect, test } from "bun:test";

import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";

import { Splurge } from "../../target/types/splurge";
import { fetchStoreAcc } from "../accounts";
import { MAX_STORE_NAME_LEN } from "../constants";
import { getStorePda } from "../pda";
import { expectAnchorError, fundedSystemAccountInfo, getSetup } from "../setup";

describe("initializeStore", () => {
  let { program } = {} as {
    program: Program<Splurge>;
  };

  const storeAuthority = Keypair.generate();

  beforeEach(async () => {
    ({ program } = await getSetup([
      {
        pubkey: storeAuthority.publicKey,
        account: fundedSystemAccountInfo(),
      },
    ]));
  });

  test("creates a store", async () => {
    const name = "Store A";
    const image = "https://example.com/image.png";
    const about = "about";

    await program.methods
      .initializeStore({
        name,
        image,
        about,
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();

    const storePda = getStorePda(storeAuthority.publicKey);
    const storeAcc = await fetchStoreAcc(program, storePda);

    expect(storeAcc.name).toBe(name);
    expect(storeAcc.image).toBe(image);
    expect(storeAcc.about).toBe(about);
    expect(storeAcc.authority).toStrictEqual(storeAuthority.publicKey);
  });

  test("throws when name is empty", async () => {
    const name = "";
    const image = "https://example.com/image.png";
    const about = "about";

    try {
      await program.methods
        .initializeStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, "StoreNameRequired");
    }
  });

  test("throws when name is too long", async () => {
    const name = "a".repeat(MAX_STORE_NAME_LEN + 1);
    const image = "https://example.com/image.png";
    const about = "about";

    try {
      await program.methods
        .initializeStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, "StoreNameTooLong");
    }
  });

  test("throws when image is empty", async () => {
    const name = "Store A";
    const image = "";
    const about = "about";

    try {
      await program.methods
        .initializeStore({
          name,
          image,
          about,
        })
        .accounts({
          authority: storeAuthority.publicKey,
        })
        .signers([storeAuthority])
        .rpc();
    } catch (err) {
      expectAnchorError(err, "StoreImageRequired");
    }
  });
});
