import {
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { createInitializeConfigInstruction } from "@splurge/sdk";

import { PYUSD_MINT, PYUSD_PRICE_UPDATE_V2, USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { admin, connection, sendTransaction, treasury } from "../setup";

console.log("Initializing config...");

// Params
const acceptedMints = [
  {
    mint: USDC_MINT,
    priceUpdateV2: USDC_PRICE_UPDATE_V2,
  },
  {
    mint: PYUSD_MINT,
    priceUpdateV2: PYUSD_PRICE_UPDATE_V2,
  },
];
const orderFeeBps = 250;

const signature = await sendTransaction([
  createInitializeConfigInstruction(
    { authority: admin.publicKey, systemProgram: SystemProgram.programId },
    {
      acceptedMints,
      admin: admin.publicKey,
      orderFeeBps,
    },
  ),
]);

console.log("Config initialized:", signature);

console.log("Initializing treasury ATAs...");

for (const { mint } of acceptedMints) {
  const mintAcc = await connection.getAccountInfo(mint);
  if (!mintAcc) throw new Error(`Mint not found: ${mint.toBase58()}`);
  const { owner } = mintAcc;

  const ata = getAssociatedTokenAddressSync(mint, treasury, true, owner);

  const ataAcc = await connection.getAccountInfo(ata);

  if (!ataAcc) {
    await getOrCreateAssociatedTokenAccount(
      connection,
      admin,
      mint,
      treasury,
      !PublicKey.isOnCurve(treasury),
      "confirmed",
      {
        commitment: "confirmed",
      },
      owner,
    );

    console.log(`Treasury ATA for ${mint.toBase58()} initialized: ${ata.toBase58()}`);
  }
}
