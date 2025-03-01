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
import usdc from '../fixtures/usdc_mint.json';
import { getItemPdaAndBump, getStorePdaAndBump } from '../pda';
import { getItemAcc } from '../accounts';

describe('updateItem', () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Splurge>;
  };

  const [treasury, store] = Array.from({ length: 2 }, Keypair.generate);

  const itemName = 'Item A';

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup(
      [treasury, store].map((kp) => {
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
    const whitelistedMints = [new PublicKey(usdc.pubkey)];
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

    await program.methods
      .createStore({
        name: 'Store A',
        image: 'https://example.com/image.png',
        about: 'about',
      })
      .accounts({
        authority: store.publicKey,
      })
      .signers([store])
      .rpc();

    await program.methods
      .createItem({
        price: 1000, // $10
        inventoryCount: 10,
        name: itemName,
        image: 'https://example.com/item.png',
        description: 'description',
      })
      .accounts({
        authority: store.publicKey,
      })
      .signers([store])
      .rpc();
  });

  test('updates an item', async () => {
    const price = 20;
    const inventoryCount = 5;

    const [storePda] = getStorePdaAndBump(store.publicKey);
    const [itemPda] = getItemPdaAndBump(storePda, itemName);

    await program.methods
      .updateItem({
        price,
        inventoryCount,
      })
      .accountsPartial({
        authority: store.publicKey,
        store: storePda,
        item: itemPda,
      })
      .signers([store])
      .rpc();

    const itemAcc = await getItemAcc(program, itemPda);

    expect(itemAcc.price).toBe(price);
    expect(itemAcc.inventoryCount).toBe(inventoryCount);
  });
});
