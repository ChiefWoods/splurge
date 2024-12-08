import { Keypair, PublicKey } from "@solana/web3.js";
import idl from "../target/idl/splurge.json";
import { Program, workspace } from "@coral-xyz/anchor";
import { Splurge } from "../target/types/splurge";

export const program = workspace.Splurge as Program<Splurge>;
export const connection = program.provider.connection;
export const masterWallet = Keypair.fromSecretKey(
  new Uint8Array(await Bun.file("splurge-wallet.json").json()),
);

const SPLURGE_PROGRAM_ID = new PublicKey(idl.address);
const SPLURGE_PROGRAM_DATA_PDA = PublicKey.findProgramAddressSync(
  [SPLURGE_PROGRAM_ID.toBuffer()],
  new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111"),
)[0];

export async function getFundedKeypair(): Promise<Keypair> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();

  const keypair = Keypair.generate();

  await connection.confirmTransaction({
    blockhash,
    lastValidBlockHeight,
    signature: await connection.requestAirdrop(
      keypair.publicKey,
      5_000_000_000,
    ),
  });

  return keypair;
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

async function getSplurgeConfigAcc() {
  return program.account.splurgeConfig.fetch(getSplurgeConfigPdaAndBump()[0]);
}

export async function initializeConfig(
  admin: Keypair,
  whitelistedMints: PublicKey[],
) {
  await program.methods
    .initializeConfig(whitelistedMints)
    .accounts({
      authority: admin.publicKey,
      splurgeProgramData: SPLURGE_PROGRAM_DATA_PDA,
    })
    .signers([admin])
    .rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc() };
}

export async function setAdmin(oldAdmin: Keypair, newAdmin: Keypair) {
  await program.methods
    .setAdmin(newAdmin.publicKey)
    .accounts({
      authority: oldAdmin.publicKey,
    })
    .signers([oldAdmin])
    .rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc() };
}

export async function addWhitelistedMint(admin: Keypair, mints: PublicKey[]) {
  await program.methods.addWhitelistedMint(mints).signers([admin]).rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc() };
}

export async function removeWhitelistedMint(
  admin: Keypair,
  mints: PublicKey[],
) {
  await program.methods.removeWhitelistedMint(mints).signers([admin]).rpc();

  return { splurgeConfigAcc: await getSplurgeConfigAcc() };
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

  const [shopperPda] = getShopperPdaAndBump(authority.publicKey);

  return {
    shopperAcc: await program.account.shopper.fetch(shopperPda),
  };
}

export async function createStore(
  program: Program<Splurge>,
  name: string,
  image: string,
  authority: Keypair,
) {
  await program.methods
    .createStore(name, image)
    .accounts({
      authority: authority.publicKey,
    })
    .signers([authority])
    .rpc();

  const [storePda] = getStorePdaAndBump(authority.publicKey);

  return {
    storeAcc: await program.account.store.fetch(storePda),
  };
}
