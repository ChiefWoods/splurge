import { beforeEach, describe, expect, test } from 'bun:test';
import { initializeConfig, setAdmin } from '../methods';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { BanksClient, ProgramTestContext } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { Splurge } from '../../target/types/splurge';
import { AnchorError, Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../utils';

describe('setAdmin', () => {
  let { context, banksClient, payer, provider, program } = {} as {
    context: ProgramTestContext;
    banksClient: BanksClient;
    payer: Keypair;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const newAdmin = Keypair.generate();

  beforeEach(async () => {
    ({ context, banksClient, payer, provider, program } = await getBankrunSetup(
      [
        {
          address: newAdmin.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: 5_000_000_000,
            owner: SystemProgram.programId,
          },
        },
      ]
    ));

    await initializeConfig(program, payer, [
      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
      new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    ]);
  });

  test('set config admin', async () => {
    const { splurgeConfigAcc } = await setAdmin(program, payer, newAdmin);

    expect(splurgeConfigAcc.admin).toEqual(newAdmin.publicKey);
  });

  test('throws if updating config to same admin', async () => {
    try {
      await setAdmin(program, payer, payer);
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual('AdminAlreadyAssigned');
      expect(err.error.errorCode.number).toEqual(6002);
    }
  });
});
