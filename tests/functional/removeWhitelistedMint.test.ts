import { beforeEach, describe, expect, test } from 'bun:test';
import { initializeConfig, removeWhitelistedMint } from '../methods';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';

describe('removeWhitelistedMint', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const whitelistedMints = [
    new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
  ];

  beforeEach(async () => {
    ({ context, banksClient, payer, provider, program } =
      await getBankrunSetup());

    await initializeConfig(program, payer, whitelistedMints);
  });

  test('remove whitelisted mints', async () => {
    const mintToRemove = whitelistedMints[0];

    const { splurgeConfigAcc } = await removeWhitelistedMint(program, payer, [
      mintToRemove,
    ]);

    expect(splurgeConfigAcc.whitelistedMints).not.toContain(mintToRemove);
  });

  test('throws if mint is not whitelisted', async () => {
    const mintsToRemove = [
      new PublicKey('USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA'),
    ];

    try {
      await removeWhitelistedMint(program, payer, mintsToRemove);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.error.errorCode.code).toEqual('MintNotWhitelisted');
      expect(err.error.errorCode.number).toEqual(6004);
    }
  });

  test('throws if removing all whitelisted mints', async () => {
    try {
      await removeWhitelistedMint(program, payer, whitelistedMints);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.error.errorCode.code).toEqual(
        'CannotRemoveAllWhitelistedMints'
      );
      expect(err.error.errorCode.number).toEqual(6005);
    }
  });
});
