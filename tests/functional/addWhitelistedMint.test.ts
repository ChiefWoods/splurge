import { beforeEach, describe, expect, test } from 'bun:test';
import { addWhitelistedMint, initializeConfig } from '../methods';
import { Keypair, PublicKey } from '@solana/web3.js';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';

describe('addWhitelistedMint', () => {
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

  test('add whitelisted mints', async () => {
    const newMints = [
      new PublicKey('USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA'),
      new PublicKey('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo'),
    ];

    const { splurgeConfigAcc } = await addWhitelistedMint(
      program,
      payer,
      newMints
    );

    expect(splurgeConfigAcc.whitelistedMints).toEqual([
      ...whitelistedMints,
      ...newMints,
    ]);
  });

  test('throws if mint is already whitelisted', async () => {
    const newMint = whitelistedMints[0];

    try {
      await addWhitelistedMint(program, payer, [newMint]);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('MintAlreadyWhitelisted');
      expect(err.error.errorCode.number).toEqual(6003);
    }
  });
});
