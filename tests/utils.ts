import { Program } from '@coral-xyz/anchor';
import { Splurge } from '../target/types/splurge';
import { AddedAccount, startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import idl from '../target/idl/splurge.json';

export async function getBankrunSetup(accounts: AddedAccount[] = []) {
  const context = await startAnchor('', [], accounts);
  const banksClient = context.banksClient;
  const payer = context.payer;
  const provider = new BankrunProvider(context);
  const program = new Program(idl as Splurge, provider);

  return {
    context,
    banksClient,
    payer,
    provider,
    program,
  };
}
