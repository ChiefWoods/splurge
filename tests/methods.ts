import { BN, Program } from '@coral-xyz/anchor';
import { Splurge } from '../target/types/splurge';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getOrderAcc,
  getReviewAcc,
  getShopperAcc,
  getSplurgeConfigAcc,
  getStoreAcc,
  getStoreItemAcc,
} from './accounts';
import {
  getOrderPdaAndBump,
  getReviewPdaAndBump,
  getShopperPdaAndBump,
  getSplurgeConfigPdaAndBump,
  getStoreItemPdaAndBump,
  getStorePdaAndBump,
} from './pda';

export async function initializeConfig(
  program: Program<Splurge>,
  admin: Keypair,
  whitelistedMints: PublicKey[]
) {
  await program.methods
    .initializeConfig(whitelistedMints)
    .accounts({
      authority: admin.publicKey,
    })
    .signers([admin])
    .rpc();

  return {
    splurgeConfigAcc: await getSplurgeConfigAcc(
      program,
      getSplurgeConfigPdaAndBump()[0]
    ),
  };
}

export async function setAdmin(
  program: Program<Splurge>,
  oldAdmin: Keypair,
  newAdmin: Keypair
) {
  await program.methods
    .setAdmin(newAdmin.publicKey)
    .accounts({
      authority: oldAdmin.publicKey,
    })
    .signers([oldAdmin])
    .rpc();

  return {
    splurgeConfigAcc: await getSplurgeConfigAcc(
      program,
      getSplurgeConfigPdaAndBump()[0]
    ),
  };
}

export async function addWhitelistedMint(
  program: Program<Splurge>,
  admin: Keypair,
  mints: PublicKey[]
) {
  await program.methods.addWhitelistedMint(mints).signers([admin]).rpc();

  return {
    splurgeConfigAcc: await getSplurgeConfigAcc(
      program,
      getSplurgeConfigPdaAndBump()[0]
    ),
  };
}

export async function removeWhitelistedMint(
  program: Program<Splurge>,
  admin: Keypair,
  mints: PublicKey[]
) {
  await program.methods.removeWhitelistedMint(mints).signers([admin]).rpc();

  return {
    splurgeConfigAcc: await getSplurgeConfigAcc(
      program,
      getSplurgeConfigPdaAndBump()[0]
    ),
  };
}

export async function createShopper(
  program: Program<Splurge>,
  name: string,
  image: string,
  address: string,
  authority: Keypair
) {
  await program.methods
    .createShopper(name, image, address)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [shopperPda] = getShopperPdaAndBump(authority.publicKey);

  return { shopperAcc: await getShopperAcc(program, shopperPda) };
}

export async function createStore(
  program: Program<Splurge>,
  name: string,
  image: string,
  about: string,
  authority: Keypair
) {
  await program.methods
    .createStore(name, image, about)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);

  return { storeAcc: await getStoreAcc(program, storePda) };
}

export async function updateStore(
  program: Program<Splurge>,
  name: string,
  image: string,
  about: string,
  authority: Keypair
) {
  await program.methods
    .updateStore(name, image, about)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);

  return { storeAcc: await getStoreAcc(program, storePda) };
}

export async function createItem(
  program: Program<Splurge>,
  name: string,
  image: string,
  description: string,
  inventoryCount: number,
  price: number,
  authority: Keypair
) {
  await program.methods
    .createItem(name, image, description, new BN(inventoryCount), price)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);
  const [storeItemPda] = getStoreItemPdaAndBump(storePda, name);

  return {
    storeItemAcc: await getStoreItemAcc(program, storeItemPda),
    storeAcc: await getStoreAcc(program, storePda),
  };
}

export async function updateItem(
  program: Program<Splurge>,
  name: string,
  inventoryCount: number,
  price: number,
  authority: Keypair
) {
  await program.methods
    .updateItem(name, new BN(inventoryCount), price)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);
  const [storeItemPda] = getStoreItemPdaAndBump(storePda, name);

  return { storeItemAcc: await getStoreItemAcc(program, storeItemPda) };
}

export async function deleteItem(
  program: Program<Splurge>,
  name: string,
  authority: Keypair
) {
  await program.methods
    .deleteItem(name)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);

  return { storeAcc: await getStoreAcc(program, storePda) };
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
  admin: Keypair
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

  const [shopperPda] = getShopperPdaAndBump(authority.publicKey);
  const [orderPda] = getOrderPdaAndBump(
    shopperPda,
    storeItemPda,
    new BN(timestamp)
  );

  return {
    shopperAcc: await getShopperAcc(program, shopperPda),
    storeItemAcc: await getStoreItemAcc(program, storeItemPda),
    orderAcc: await getOrderAcc(program, orderPda),
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
  admin: Keypair
) {
  await program.methods
    .updateOrder(status)
    .accounts({
      admin: admin.publicKey,
      order: orderPda,
    })
    .signers([admin])
    .rpc();

  return { orderAcc: await getOrderAcc(program, orderPda) };
}

export async function completeOrder(
  program: Program<Splurge>,
  timestamp: number,
  admin: Keypair,
  shopperPda: PublicKey,
  storePda: PublicKey,
  storeItemPda: PublicKey,
  paymentMint: PublicKey,
  tokenProgram: PublicKey
) {
  await program.methods
    .completeOrder(new BN(timestamp))
    .accounts({
      admin: admin.publicKey,
      shopper: shopperPda,
      store: storePda,
      storeItem: storeItemPda,
      paymentMint,
      tokenProgram,
    })
    .signers([admin])
    .rpc();

  const [orderPda] = getOrderPdaAndBump(
    shopperPda,
    storeItemPda,
    new BN(timestamp)
  );

  return { orderAcc: await getOrderAcc(program, orderPda) };
}

export async function createReview(
  program: Program<Splurge>,
  text: string,
  rating: number,
  authority: Keypair,
  storeItemPda: PublicKey,
  orderPda: PublicKey
) {
  await program.methods
    .createReview(text, rating)
    .accounts({
      authority: authority.publicKey,
      storeItem: storeItemPda,
      order: orderPda,
    })
    .signers([authority])
    .rpc();

  const [reviewPda] = getReviewPdaAndBump(orderPda);

  return {
    reviewAcc: await getReviewAcc(program, reviewPda),
    storeItemAcc: await getStoreItemAcc(program, storeItemPda),
  };
}

export async function withdrawEarnings(
  program: Program<Splurge>,
  authority: Keypair,
  admin: Keypair,
  paymentMint: PublicKey,
  tokenProgram: PublicKey
) {
  await program.methods
    .withdrawEarnings()
    .accounts({
      authority: authority.publicKey,
      admin: admin.publicKey,
      paymentMint,
      tokenProgram,
    })
    .signers([authority, admin])
    .rpc();
}
