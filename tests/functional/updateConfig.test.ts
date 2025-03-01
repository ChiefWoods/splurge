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
import { Program } from '@coral-xyz/anchor';
import { getBankrunSetup } from '../setup';
import { getConfigPdaAndBump } from '../pda';
import usdc from '../fixtures/usdc_mint.json';
import usdt from '../fixtures/usdt_mint.json';
import pyusd from '../fixtures/pyusd_mint.json';
import { getConfigAcc } from '../accounts';

describe('updateConfig', () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const [treasury, newAdmin, newTreasury] = Array.from(
    { length: 3 },
    Keypair.generate
  );

  const whitelistedMints = [
    new PublicKey(usdc.pubkey),
    new PublicKey(usdt.pubkey),
  ];

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup(
      [treasury, newAdmin, newTreasury].map((kp) => {
        return {
          address: kp.publicKey,
          info: {
            data: Buffer.alloc(0),
            executable: false,
            lamports: LAMPORTS_PER_SOL,
            owner: SystemProgram.programId,
          },
        };
      })
    ));

    const admin = context.payer;
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
  });

  test('updates a config', async () => {
    const orderFeeBps = 500;
    whitelistedMints.push(new PublicKey(pyusd.pubkey));

    await program.methods
      .updateConfig({
        newAdmin: newAdmin.publicKey,
        treasury: newTreasury.publicKey,
        locked: true,
        orderFeeBps,
        whitelistedMints,
      })
      .accounts({
        admin: context.payer.publicKey,
      })
      .signers([context.payer])
      .rpc();

    const [configPda] = getConfigPdaAndBump();
    const configAcc = await getConfigAcc(program, configPda);

    expect(configAcc.admin).toStrictEqual(newAdmin.publicKey);
    expect(configAcc.treasury).toStrictEqual(newTreasury.publicKey);
    expect(configAcc.orderFeeBps).toBe(orderFeeBps);
    expect(configAcc.whitelistedMints).toStrictEqual(whitelistedMints);
  });
});
