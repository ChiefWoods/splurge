import { AnchorError, BN, Program } from '@coral-xyz/anchor';
import { Splurge } from '../target/types/splurge';
import idl from '../target/idl/splurge.json';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { AccountInfoBytes, ComputeBudget, LiteSVM } from 'litesvm';
import { fromWorkspace, LiteSVMProvider } from 'anchor-litesvm';
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  MintLayout,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  CONFIG_V0,
  MINT_DECIMALS,
  TUKTUK_PROGRAM_ID,
  USDC_MINT,
  USDT_MINT,
} from './constants';
import { expect } from 'bun:test';
import usdcPriceUpdateV2AccInfo from './fixtures/usdc_price_update_v2.json';
import usdtPriceUpdateV2AccInfo from './fixtures/usdt_price_update_v2.json';
import tuktukIdl from './fixtures/tuktuk.json';
import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';
import tuktukConfigV0 from './fixtures/tuktuk_config_v0.json';
import { taskQueueKey, taskQueueNameMappingKey } from '@helium/tuktuk-sdk';
import { fetchConfigV0Acc } from './accounts';

export async function getSetup(
  accounts: { pubkey: PublicKey; account: AccountInfoBytes }[] = []
) {
  const litesvm = fromWorkspace('./');
  litesvm.addProgramFromFile(TUKTUK_PROGRAM_ID, 'tests/fixtures/tuktuk.so');
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
  const program = new Program<Splurge>(idl, provider);

  litesvm.setAccount(CONFIG_V0, {
    data: Buffer.from(tuktukConfigV0.account.data[0], 'base64'),
    executable: tuktukConfigV0.account.executable,
    lamports: tuktukConfigV0.account.lamports,
    owner: new PublicKey(tuktukConfigV0.account.owner),
  });

  const tuktukProgram = new Program<Tuktuk>(tuktukIdl, provider);
  const tuktukConfigV0Acc = await fetchConfigV0Acc(tuktukProgram, CONFIG_V0);
  const [taskQueuePda] = taskQueueKey(
    CONFIG_V0,
    tuktukConfigV0Acc.nextTaskQueueId
  );

  return { litesvm, provider, program, tuktukProgram, taskQueuePda };
}

export function fundedSystemAccountInfo(
  lamports: number = LAMPORTS_PER_SOL
): AccountInfoBytes {
  return {
    lamports,
    data: Buffer.alloc(0),
    owner: SystemProgram.programId,
    executable: false,
  };
}

export async function expectAnchorError(error: Error, code: string) {
  expect(error).toBeInstanceOf(AnchorError);
  const { errorCode } = (error as AnchorError).error;
  expect(errorCode.code).toBe(code);
}

function initDataAcc(litesvm: LiteSVM, accInfo: any) {
  litesvm.setAccount(new PublicKey(accInfo.pubkey), {
    data: Buffer.from(accInfo.account.data[0], 'base64'),
    executable: accInfo.account.executable,
    lamports: accInfo.account.lamports,
    owner: new PublicKey(accInfo.account.owner),
  });
}

function initMint(
  litesvm: LiteSVM,
  mint: PublicKey,
  owner: PublicKey = TOKEN_PROGRAM_ID
) {
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
    mintData
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
  amount: number = 100 * 10 ** MINT_DECIMALS
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
    ataData
  );

  const tokenProgram = litesvm.getAccount(mint).owner;

  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    !PublicKey.isOnCurve(owner),
    tokenProgram
  );

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
  taskQueuePda: PublicKey
) {
  const taskQueueName = 'test-queue';

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
      taskQueueNameMapping: taskQueueNameMappingKey(
        CONFIG_V0,
        taskQueueName
      )[0],
      tuktukConfig: CONFIG_V0,
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
