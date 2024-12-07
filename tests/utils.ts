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

export async function initializeConfig(admin: Keypair) {
  await program.methods
    .initializeConfig()
    .accounts({
      authority: admin.publicKey,
      splurgeProgramData: SPLURGE_PROGRAM_DATA_PDA,
    })
    .signers([admin])
    .rpc();

  const [splurgeConfigPda] = getSplurgeConfigPdaAndBump();

  return {
    splurgeConfigAcc:
      await program.account.splurgeConfig.fetch(splurgeConfigPda),
  };
}

export async function updateAdmin(oldAdmin: Keypair, newAdmin: Keypair) {
  await program.methods
    .updateAdmin(newAdmin.publicKey)
    .accounts({
      authority: oldAdmin.publicKey,
    })
    .signers([oldAdmin])
    .rpc();

  const [splurgeConfigPda] = getSplurgeConfigPdaAndBump();

  return {
    splurgeConfigAcc:
      await program.account.splurgeConfig.fetch(splurgeConfigPda),
  };
}
