import { expect } from "bun:test";

import { BN, Program } from "@coral-xyz/anchor";
import { Tuktuk } from "@helium/tuktuk-idls/lib/types/tuktuk.js";
import { taskQueueKey, taskQueueNameMappingKey } from "@helium/tuktuk-sdk";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  MintLayout,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendTransactionError,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { AccountInfoBytes, ComputeBudget, LiteSVM } from "litesvm";

import { TUKTUK_PROGRAM_ID, TUKTUK_CONFIG, tuktukIdl, tuktukConfigV0 } from "../common/tuktuk";
import { fetchConfigV0Acc } from "./accounts";
import { MINT_DECIMALS, USDC_MINT, USDT_MINT } from "./constants";
import { usdcPriceUpdateV2AccInfo, usdtPriceUpdateV2AccInfo } from "./fixtures";

export async function getSetup(accounts: { pubkey: PublicKey; account: AccountInfoBytes }[] = []) {
  const litesvm = fromWorkspace("./");
  litesvm.addProgramFromFile(TUKTUK_PROGRAM_ID, "common/tuktuk/tuktuk.so");
  litesvm.withLogBytesLimit(null);

  const computeBudget = new ComputeBudget();
  computeBudget.computeUnitLimit = 400_000n;
  litesvm.withComputeBudget(computeBudget);

  initMint(litesvm, USDC_MINT);
  initMint(litesvm, USDT_MINT);
  initDataAcc(litesvm, usdcPriceUpdateV2AccInfo);
  initDataAcc(litesvm, usdtPriceUpdateV2AccInfo);

  for (const { pubkey, account } of accounts) {
    litesvm.setAccount(new PublicKey(pubkey), {
      data: account.data,
      executable: account.executable,
      lamports: account.lamports,
      owner: new PublicKey(account.owner),
    });
  }

  const provider = new LiteSVMProvider(litesvm);

  litesvm.setAccount(TUKTUK_CONFIG, {
    data: Buffer.from(tuktukConfigV0.account.data[0], "base64"),
    executable: tuktukConfigV0.account.executable,
    lamports: tuktukConfigV0.account.lamports,
    owner: new PublicKey(tuktukConfigV0.account.owner),
  });

  const tuktukProgram = new Program<Tuktuk>(tuktukIdl, provider);
  const tuktukConfigV0Acc = await fetchConfigV0Acc(tuktukProgram, TUKTUK_CONFIG);
  if (!tuktukConfigV0Acc) {
    throw new Error("Tuktuk config account missing in setup");
  }
  const [taskQueuePda] = taskQueueKey(TUKTUK_CONFIG, tuktukConfigV0Acc.nextTaskQueueId);

  return {
    litesvm,
    provider,
    connection: provider.connection,
    tuktukProgram,
    taskQueuePda,
  };
}

export function fundedSystemAccountInfo(lamports: number = LAMPORTS_PER_SOL): AccountInfoBytes {
  return {
    lamports,
    data: Buffer.alloc(0),
    owner: SystemProgram.programId,
    executable: false,
  };
}

export async function expectAnchorError(error: unknown, code: string) {
  expect(error).toBeInstanceOf(SendTransactionError);
  const logs = (error as SendTransactionError).logs;
  expect(logs.join("\n")).toContain(`Error Code: ${code}`);
}

function initDataAcc(litesvm: LiteSVM, accInfo: any) {
  litesvm.setAccount(new PublicKey(accInfo.pubkey), {
    data: Buffer.from(accInfo.account.data[0], "base64"),
    executable: accInfo.account.executable,
    lamports: accInfo.account.lamports,
    owner: new PublicKey(accInfo.account.owner),
  });
}

function initMint(litesvm: LiteSVM, mint: PublicKey, owner: PublicKey = TOKEN_PROGRAM_ID) {
  const mintData = Buffer.alloc(MINT_SIZE);

  MintLayout.encode(
    {
      mintAuthority: PublicKey.default,
      mintAuthorityOption: 0,
      supply: BigInt(1000000 * 10 ** MINT_DECIMALS),
      decimals: MINT_DECIMALS,
      isInitialized: true,
      freezeAuthority: PublicKey.default,
      freezeAuthorityOption: 0,
    },
    mintData,
  );

  litesvm.setAccount(mint, {
    data: mintData,
    executable: false,
    lamports: LAMPORTS_PER_SOL,
    owner,
  });
}

export function initAta(
  litesvm: LiteSVM,
  mint: PublicKey,
  owner: PublicKey,
  amount: number = 100 * 10 ** MINT_DECIMALS,
) {
  const ataData = Buffer.alloc(ACCOUNT_SIZE);

  AccountLayout.encode(
    {
      amount: BigInt(amount),
      closeAuthority: owner,
      closeAuthorityOption: 1,
      delegate: PublicKey.default,
      delegatedAmount: 0n,
      delegateOption: 0,
      isNative: 0n,
      isNativeOption: 0,
      mint,
      owner,
      state: 1,
    },
    ataData,
  );

  const tokenProgram = litesvm.getAccount(mint).owner;

  const ata = getAssociatedTokenAddressSync(mint, owner, !PublicKey.isOnCurve(owner), tokenProgram);

  litesvm.setAccount(ata, {
    data: ataData,
    executable: false,
    lamports: LAMPORTS_PER_SOL,
    owner: tokenProgram,
  });
}

export async function initTaskQueue(
  tuktukProgram: Program<Tuktuk>,
  payer: Keypair,
  taskQueuePda: PublicKey,
) {
  const taskQueueName = "test-queue";

  await tuktukProgram.methods
    .initializeTaskQueueV0({
      capacity: 10,
      lookupTables: [],
      minCrankReward: new BN(50000),
      name: taskQueueName,
      staleTaskAge: 3600,
    })
    .accounts({
      payer: payer.publicKey,
      taskQueue: taskQueuePda,
      taskQueueNameMapping: taskQueueNameMappingKey(TUKTUK_CONFIG, taskQueueName)[0],
      tuktukConfig: TUKTUK_CONFIG,
      updateAuthority: payer.publicKey,
    })
    .signers([payer])
    .rpc();

  await tuktukProgram.methods
    .addQueueAuthorityV0()
    .accountsPartial({
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
      queueAuthority: payer.publicKey,
      taskQueue: taskQueuePda,
    })
    .signers([payer])
    .rpc();
}

export async function sendTransaction(
  provider: LiteSVMProvider,
  instructions: TransactionInstruction[],
  signers: Signer[],
) {
  return provider.sendAndConfirm!(new Transaction().add(...instructions), signers);
}
