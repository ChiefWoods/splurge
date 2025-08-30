import { getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { PYUSD_MINT, PYUSD_PRICE_UPDATE_V2, USDC_MINT, USDC_PRICE_UPDATE_V2 } from "../constants";
import { admin, connection, splurgeProgram, treasury } from "../setup";

console.log("Initializing config...")

// Params
const acceptedMints = [
  {
    mint: USDC_MINT,
    priceUpdateV2: USDC_PRICE_UPDATE_V2,
  },
  {
    mint: PYUSD_MINT,
    priceUpdateV2: PYUSD_PRICE_UPDATE_V2,
  }
];
const orderFeeBps = 250;

const signature = await splurgeProgram.methods
  .initializeConfig({
    acceptedMints,
    admin: admin.publicKey,
    orderFeeBps,
    treasury: treasury.publicKey,
  })
  .accounts({
    authority: admin.publicKey,
  })
  .signers([admin])
  .rpc();

console.log("Config initialized:", signature);

console.log("Initializing treasury ATAs...")

for (const { mint } of acceptedMints) {
  const { owner } = await connection.getAccountInfo(mint);

  const ata = getAssociatedTokenAddressSync(
    mint,
    treasury.publicKey,
    true,
    owner
  );

  const ataAcc = await connection.getAccountInfo(ata);

  if (!ataAcc) {
    await getOrCreateAssociatedTokenAccount(
      connection,
      admin,
      mint,
      treasury.publicKey,
      false,
      "confirmed",
      {
        commitment: "confirmed"
      },
      owner,
    )
  
    console.log(`Treasury ATA for ${mint.toBase58()} initialized: ${ata.toBase58()}`);
  
  }
}