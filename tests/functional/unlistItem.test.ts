import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair } from '@solana/web3.js';
import { Splurge } from '../../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from '../constants';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { fundedSystemAccountInfo, getSetup } from '../setup';
import { getItemPda, getStorePda } from '../pda';

describe('unlistItem', () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
  };

  const [admin, storeAuthority] = Array.from({ length: 2 }, Keypair.generate);

  const itemName = 'Item A';

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      ...[admin, storeAuthority].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(),
        };
      }),
    ]));

    await program.methods
      .initializeConfig({
        acceptedMints: [
          {
            mint: USDC_MINT,
            priceUpdateV2: USDC_PRICE_UPDATE_V2,
          },
        ],
        admin: admin.publicKey,
        orderFeeBps: 250,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .initializeStore({
        name: 'Store A',
        image: 'https://example.com/image.png',
        about: 'about',
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();

    await program.methods
      .listItem({
        price: new BN(1e6), // $1
        inventoryCount: 10,
        name: itemName,
        image: 'https://example.com/item.png',
        description: 'description',
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();
  });

  test('unlist an item', async () => {
    const storePda = getStorePda(storeAuthority.publicKey);
    const itemPda = getItemPda(storePda, itemName);

    await program.methods
      .unlistItem()
      .accountsPartial({
        authority: storeAuthority.publicKey,
        store: storePda,
        item: itemPda,
      })
      .signers([storeAuthority])
      .rpc();

    const itemAccBal = litesvm.getBalance(itemPda);

    expect(itemAccBal).toBe(0n);
  });
});
