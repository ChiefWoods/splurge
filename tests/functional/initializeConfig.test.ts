import { beforeEach, describe, expect, test } from 'bun:test';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../setup';
import { getConfigPdaAndBump } from '../pda';
import usdc from '../fixtures/usdc_mint.json';
import usdt from '../fixtures/usdt_mint.json';
import { getConfigAcc } from '../accounts';

describe('initializeConfig', () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const treasury = Keypair.generate();

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup([
      {
        address: treasury.publicKey,
        info: {
          data: Buffer.alloc(0),
          executable: false,
          lamports: LAMPORTS_PER_SOL,
          owner: SystemProgram.programId,
        },
      },
    ]));
  });

  test('initializes a config', async () => {
    const admin = context.payer;
    const whitelistedMints = [
      new PublicKey(usdc.pubkey),
      new PublicKey(usdt.pubkey),
    ];
    const orderFeeBps = 250;

    await program.methods
      .initializeConfig({
        admin: admin.publicKey,
        treasury: treasury.publicKey,
        whitelistedMints,
        orderFeeBps,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const [configPda, configBump] = getConfigPdaAndBump();
    const configAcc = await getConfigAcc(program, configPda);

    expect(configAcc.bump).toBe(configBump);
    expect(configAcc.admin).toStrictEqual(admin.publicKey);
    expect(configAcc.treasury).toStrictEqual(treasury.publicKey);
    expect(configAcc.platformLocked).toBe(false);
    expect(configAcc.orderFeeBps).toBe(orderFeeBps);
    expect(configAcc.whitelistedMints).toStrictEqual(whitelistedMints);
  });

  test('throws if a mint is default PublicKey', async () => {
    const admin = context.payer;
    const whitelistedMints = [new PublicKey(usdc.pubkey), PublicKey.default];
    const orderFeeBps = 250;

    try {
      await program.methods
        .initializeConfig({
          admin: admin.publicKey,
          treasury: treasury.publicKey,
          whitelistedMints,
          orderFeeBps,
        })
        .accounts({
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('InvalidAddress');
    }
  });

  test('throws if whitelist is empty', async () => {
    const admin = context.payer;
    const whitelistedMints = [];
    const orderFeeBps = 250;

    try {
      await program.methods
        .initializeConfig({
          admin: admin.publicKey,
          treasury: treasury.publicKey,
          whitelistedMints,
          orderFeeBps,
        })
        .accounts({
          authority: admin.publicKey,
        })
        .signers([admin])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);

      const { errorCode } = (err as AnchorError).error;
      expect(errorCode.code).toBe('EmptyWhitelist');
    }
  });
});
