import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { Splurge } from "../target/types/splurge";
import idl from "../target/idl/splurge.json";

export const admin = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.ADMIN_KEYPAIR))
)
export const treasury = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.TREASURY_KEYPAIR))
)
export const connection = new Connection(process.env.ANCHOR_PROVIDER_URL || clusterApiUrl('devnet'))
const provider = new AnchorProvider(connection, new Wallet(admin))
export const program = new Program<Splurge>(idl, provider);