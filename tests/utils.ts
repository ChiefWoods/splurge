import { Keypair, PublicKey } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { Splurge } from "../target/types/splurge";
import { AddedAccount, startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
import idl from "../target/idl/splurge.json";

const SPLURGE_PROGRAM_ID = new PublicKey(idl.address);

export async function getBankrunSetup(accounts: AddedAccount[]) {
  const context = await startAnchor("", [], accounts);
  const banksClient = context.banksClient;
  const payer = context.payer;
  const provider = new BankrunProvider(context);
  const program = new Program(idl as Splurge, provider);

  return {
    context,
    banksClient,
    payer,
    provider,
    program,
  };
}

export function getSplurgeConfigPdaAndBump(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("splurge_config")],
    SPLURGE_PROGRAM_ID,
  );
}

export function getShopperPdaAndBump(
  authority: PublicKey,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("shopper"), authority.toBuffer()],
    SPLURGE_PROGRAM_ID,
  );
}

export function getStorePdaAndBump(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("store"), authority.toBuffer()],
    SPLURGE_PROGRAM_ID,
  );
}

export function getStoreItemPdaAndBump(
  storePda: PublicKey,
  name: string,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("store_item"), storePda.toBuffer(), Buffer.from(name)],
    SPLURGE_PROGRAM_ID,
  );
}

export function getOrderPdaAndBump(
  shopperPda: PublicKey,
  storeItemPda: PublicKey,
  timestamp: BN,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("order"),
      shopperPda.toBuffer(),
      storeItemPda.toBuffer(),
      timestamp.toArrayLike(Buffer, "le", 8),
    ],
    SPLURGE_PROGRAM_ID,
  );
}

async function getSplurgeConfigAcc(program: Program<Splurge>) {
  return await program.account.splurgeConfig.fetchNullable(
    getSplurgeConfigPdaAndBump()[0],
  );
}

async function getShopperAcc(program: Program<Splurge>, shopperPda: PublicKey) {
  return await program.account.shopper.fetchNullable(shopperPda);
}

async function getStoreAcc(program: Program<Splurge>, storePda: PublicKey) {
  return await program.account.store.fetchNullable(storePda);
}

async function getStoreItemAcc(
  program: Program<Splurge>,
  storeItemPda: PublicKey,
) {
  return await program.account.storeItem.fetchNullable(storeItemPda);
}

async function getOrderAcc(program: Program<Splurge>, orderPda: PublicKey) {
  return await program.account.order.fetchNullable(orderPda);
}

export async function initializeConfig(
  program: Program<Splurge>,
  admin: Keypair,
  whitelistedMints: PublicKey[],
) {
  await program.methods
    .initializeConfig(whitelistedMints)
    .accounts({
      authority: admin.publicKey,
    })
    .signers([admin])
    .rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc(program) };
}

export async function setAdmin(
  program: Program<Splurge>,
  oldAdmin: Keypair,
  newAdmin: Keypair,
) {
  await program.methods
    .setAdmin(newAdmin.publicKey)
    .accounts({
      authority: oldAdmin.publicKey,
    })
    .signers([oldAdmin])
    .rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc(program) };
}

export async function addWhitelistedMint(
  program: Program<Splurge>,
  admin: Keypair,
  mints: PublicKey[],
) {
  await program.methods.addWhitelistedMint(mints).signers([admin]).rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc(program) };
}

export async function removeWhitelistedMint(
  program: Program<Splurge>,
  admin: Keypair,
  mints: PublicKey[],
) {
  await program.methods.removeWhitelistedMint(mints).signers([admin]).rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc(program) };
}

export async function createShopper(
  program: Program<Splurge>,
  name: string,
  image: string,
  address: string,
  authority: Keypair,
) {
  await program.methods
    .createShopper(name, image, address)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  return {
    shopperAcc: await getShopperAcc(
      program,
      getShopperPdaAndBump(authority.publicKey)[0],
    ),
  };
}

export async function createStore(
  program: Program<Splurge>,
  name: string,
  image: string,
  about: string,
  authority: Keypair,
) {
  await program.methods
    .createStore(name, image, about)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  return {
    storeAcc: await getStoreAcc(
      program,
      getStorePdaAndBump(authority.publicKey)[0],
    ),
  };
}

export async function updateStore(
  program: Program<Splurge>,
  name: string,
  image: string,
  about: string,
  authority: Keypair,
) {
  await program.methods
    .updateStore(name, image, about)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  return {
    storeAcc: await getStoreAcc(
      program,
      getStorePdaAndBump(authority.publicKey)[0],
    ),
  };
}

export async function createItem(
  program: Program<Splurge>,
  name: string,
  image: string,
  description: string,
  inventoryCount: number,
  price: number,
  authority: Keypair,
) {
  await program.methods
    .createItem(name, image, description, new BN(inventoryCount), price)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);

  return {
    storeItemAcc: await getStoreItemAcc(
      program,
      getStoreItemPdaAndBump(storePda, name)[0],
    ),
    storeAcc: await getStoreAcc(program, storePda),
  };
}

export async function updateItem(
  program: Program<Splurge>,
  name: string,
  inventoryCount: number,
  price: number,
  authority: Keypair,
) {
  await program.methods
    .updateItem(name, new BN(inventoryCount), price)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);

  return {
    storeItemAcc: await getStoreItemAcc(
      program,
      getStoreItemPdaAndBump(storePda, name)[0],
    ),
  };
}

export async function deleteItem(
  program: Program<Splurge>,
  name: string,
  authority: Keypair,
) {
  await program.methods
    .deleteItem(name)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);

  return {
    storeAcc: await getStoreAcc(program, storePda),
  };
}

export async function createOrder(
  program: Program<Splurge>,
  timestamp: number,
  amount: number,
  totalUsd: number,
  storePda: PublicKey,
  storeItemPda: PublicKey,
  paymentMint: PublicKey,
  tokenProgram: PublicKey,
  authority: Keypair,
  admin: Keypair,
) {
  await program.methods
    .createOrder(new BN(timestamp), new BN(amount), totalUsd)
    .accounts({
      authority: authority.publicKey,
      admin: admin.publicKey,
      store: storePda,
      storeItem: storeItemPda,
      paymentMint,
      tokenProgram,
    })
    .signers([authority, admin])
    .rpc();

  return {
    shopperAcc: await getShopperAcc(
      program,
      getShopperPdaAndBump(authority.publicKey)[0],
    ),
    storeItemAcc: await getStoreItemAcc(program, storeItemPda),
    orderAcc: await getOrderAcc(
      program,
      getOrderPdaAndBump(
        getShopperPdaAndBump(authority.publicKey)[0],
        storeItemPda,
        new BN(timestamp),
      )[0],
    ),
  };
}

export async function updateOrder(
  program: Program<Splurge>,
  status:
    | { pending: {} }
    | { shipping: {} }
    | { cancelled: {} }
    | { completed: {} },
  orderPda: PublicKey,
  admin: Keypair,
) {
  await program.methods
    .updateOrder(status)
    .accounts({
      admin: admin.publicKey,
      order: orderPda,
    })
    .signers([admin])
    .rpc();

  return {
    orderAcc: await getOrderAcc(program, orderPda),
  };
}
