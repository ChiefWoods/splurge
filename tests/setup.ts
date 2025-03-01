import { Program } from '@coral-xyz/anchor';
import { Splurge } from '../target/types/splurge';
import { AddedAccount, startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import idl from '../target/idl/splurge.json';
import usdc from './fixtures/usdc_mint.json';
import usdt from './fixtures/usdt_mint.json';
import pyusd from './fixtures/pyusd_mint.json';
import { PublicKey } from '@solana/web3.js';

export async function getBankrunSetup(accounts: AddedAccount[] = []) {
  const context = await startAnchor(
    '',
    [],
    [
      ...accounts,
      {
        address: new PublicKey(usdc.pubkey),
        info: {
          data: Buffer.from(usdc.account.data[0], 'base64'),
          executable: false,
          lamports: usdc.account.lamports,
          owner: new PublicKey(usdc.account.owner),
        },
      },
      {
        address: new PublicKey(usdt.pubkey),
        info: {
          data: Buffer.from(usdt.account.data[0], 'base64'),
          executable: false,
          lamports: usdt.account.lamports,
          owner: new PublicKey(usdt.account.owner),
        },
      },
      {
        address: new PublicKey(pyusd.pubkey),
        info: {
          data: Buffer.from(pyusd.account.data[0], 'base64'),
          executable: false,
          lamports: pyusd.account.lamports,
          owner: new PublicKey(pyusd.account.owner),
        },
      },
    ],
    400000n
  );

  const provider = new BankrunProvider(context);
  const program = new Program(idl as Splurge, provider);

  return {
    context,
    provider,
    program,
  };
}
