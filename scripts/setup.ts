import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Splurge } from "../target/types/splurge";
import idl from "../target/idl/splurge.json";
import tuktukIdl from "./idl/tuktuk.json";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";

export const admin = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.ADMIN_KEYPAIR))
)
export const connection = new Connection(process.env.ANCHOR_PROVIDER_URL || clusterApiUrl('devnet'))
const provider = new AnchorProvider(connection, new Wallet(admin))
export const splurgeProgram = new Program<Splurge>(idl, provider);
export const tuktukProgram = new Program<Tuktuk>(tuktukIdl, provider);

export const [treasury] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("treasury"),
  ],
  splurgeProgram.programId
)