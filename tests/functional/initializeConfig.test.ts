import { beforeEach, describe, expect, test } from 'bun:test';
import { initializeConfig } from '../methods';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';
import { getSplurgeConfigPdaAndBump } from '../pda';

describe('initializeConfig', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  beforeEach(async () => {
    ({ context, banksClient, payer, provider, program } =
      await getBankrunSetup());
  });

  test('initializes a config', async () => {
    const whitelistedMints = [
      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    ];

    const { splurgeConfigAcc } = await initializeConfig(
      program,
      payer,
      whitelistedMints
    );

    const splurgeConfigBump = getSplurgeConfigPdaAndBump()[1];

    expect(splurgeConfigAcc.bump).toEqual(splurgeConfigBump);
    expect(splurgeConfigAcc.admin).toEqual(payer.publicKey);
    expect(splurgeConfigAcc.whitelistedMints).toEqual(whitelistedMints);
  });
});
