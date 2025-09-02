import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair } from '@solana/web3.js';
import { Splurge } from '../../target/types/splurge';
import { Program } from '@coral-xyz/anchor';
import { fetchConfigAcc } from '../accounts';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { expectAnchorError, fundedSystemAccountInfo, getSetup } from '../setup';
import {
  USDC_MINT,
  USDC_PRICE_UPDATE_V2,
  USDT_MINT,
  USDT_PRICE_UPDATE_V2,
} from '../constants';
import { getConfigPda } from '../pda';

describe('updateConfig', () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
  };

  const [admin, newAdmin] = Array.from({ length: 2 }, Keypair.generate);

  let acceptedMints = [
    {
      mint: USDC_MINT,
      priceUpdateV2: USDC_PRICE_UPDATE_V2,
    },
  ];

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      ...[admin, newAdmin].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(),
        };
      }),
    ]));

    await program.methods
      .initializeConfig({
        acceptedMints,
        admin: admin.publicKey,
        orderFeeBps: 250,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();
  });

  test('updates a config', async () => {
    acceptedMints.push({
      mint: USDT_MINT,
      priceUpdateV2: USDT_PRICE_UPDATE_V2,
    });
    const isPaused = true;
    const orderFeeBps = 500;

    await program.methods
      .updateConfig({
        acceptedMints,
        isPaused,
        newAdmin: newAdmin.publicKey,
        orderFeeBps,
      })
      .accounts({
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    const configPda = getConfigPda();
    const configAcc = await fetchConfigAcc(program, configPda);

    expect(configAcc.admin).toStrictEqual(newAdmin.publicKey);
    expect(configAcc.orderFeeBps).toBe(orderFeeBps);
    expect(configAcc.acceptedMints).toStrictEqual(acceptedMints);
  });

  test('throws if updating as unauthorized admin', async () => {
    acceptedMints.push({
      mint: USDT_MINT,
      priceUpdateV2: USDT_PRICE_UPDATE_V2,
    });
    const isPaused = true;
    const orderFeeBps = 500;

    try {
      await program.methods
        .updateConfig({
          acceptedMints,
          isPaused,
          newAdmin: newAdmin.publicKey,
          orderFeeBps,
        })
        .accounts({
          admin: newAdmin.publicKey,
        })
        .signers([newAdmin])
        .rpc();
    } catch (err) {
      expectAnchorError(err, 'UnauthorizedAdmin');
    }
  });
});
