import { beforeEach, describe, expect, test } from 'bun:test';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Splurge } from '../../target/types/splurge';
import { BN, Program } from '@coral-xyz/anchor';
import { getItemPda, getOrderPda, getShopperPda, getStorePda } from '../pda';
import { LiteSVM } from 'litesvm';
import { LiteSVMProvider } from 'anchor-litesvm';
import { fundedSystemAccountInfo, getSetup, initAta } from '../setup';
import { USDC_MINT, USDC_PRICE_UPDATE_V2 } from '../constants';

describe('withdrawEarnings', () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Splurge>;
  };

  const [admin, treasury, shopperAuthority, storeAuthority] = Array.from(
    { length: 4 },
    Keypair.generate
  );

  const itemName = 'Item A';
  const itemPrice = 10e6; // $1
  const initInventoryCount = 10;
  const initShopperAtaBal = 10e9; // $100
  const tokenProgram = TOKEN_PROGRAM_ID;
  let storePda: PublicKey;
  let itemPda: PublicKey;
  let shopperPda: PublicKey;
  let orderPda: PublicKey;

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      ...[admin, treasury, shopperAuthority, storeAuthority].map((kp) => {
        return {
          pubkey: kp.publicKey,
          account: fundedSystemAccountInfo(),
        };
      }),
    ]));

    initAta(litesvm, USDC_MINT, treasury.publicKey);
    initAta(litesvm, USDC_MINT, shopperAuthority.publicKey, initShopperAtaBal);

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
        treasury: treasury.publicKey,
      })
      .accounts({
        authority: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .initializeShopper({
        name: 'Shopper A',
        image: 'https://example.com/image.png',
        address: 'address',
      })
      .accounts({
        authority: shopperAuthority.publicKey,
      })
      .signers([shopperAuthority])
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
        price: new BN(itemPrice),
        inventoryCount: initInventoryCount,
        name: itemName,
        image: 'https://example.com/item.png',
        description: 'description',
      })
      .accounts({
        authority: storeAuthority.publicKey,
      })
      .signers([storeAuthority])
      .rpc();

    storePda = getStorePda(storeAuthority.publicKey);
    itemPda = getItemPda(storePda, itemName);
    shopperPda = getShopperPda(shopperAuthority.publicKey);
    const { unixTimestamp } = litesvm.getClock();
    orderPda = getOrderPda(shopperPda, itemPda, new BN(unixTimestamp));

    await program.methods
      .createOrder(1, new BN(unixTimestamp))
      .accountsPartial({
        authority: shopperAuthority.publicKey,
        store: storePda,
        item: itemPda,
        order: orderPda,
        priceUpdateV2: USDC_PRICE_UPDATE_V2,
        paymentMint: USDC_MINT,
        tokenProgram,
      })
      .signers([shopperAuthority])
      .rpc();

    await program.methods
      .updateOrder({ shipping: {} })
      .accounts({
        admin: admin.publicKey,
        order: orderPda,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .completeOrder()
      .accountsPartial({
        admin: admin.publicKey,
        shopper: shopperPda,
        store: storePda,
        item: itemPda,
        order: orderPda,
        tokenProgram,
      })
      .signers([admin])
      .rpc();
  });

  test('withdraw earnings', async () => {
    const storeUsdcAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      storePda,
      true,
      tokenProgram
    );
    const preStoreUsdcAtaBal = (
      await getAccount(provider.connection, storeUsdcAta)
    ).amount;

    await program.methods
      .withdrawEarnings()
      .accountsPartial({
        authority: storeAuthority.publicKey,
        store: storePda,
        paymentMint: USDC_MINT,
        tokenProgram,
      })
      .signers([storeAuthority])
      .rpc();

    const storeAuthorityUsdcAta = getAssociatedTokenAddressSync(
      USDC_MINT,
      storeAuthority.publicKey,
      false,
      tokenProgram
    );
    const storeAuthorityUsdcAtaBal = (
      await getAccount(provider.connection, storeAuthorityUsdcAta)
    ).amount;

    expect(Number(storeAuthorityUsdcAtaBal)).toBe(Number(preStoreUsdcAtaBal));

    const postStoreUsdcAtaBal = (
      await getAccount(provider.connection, storeUsdcAta, 'processed')
    ).amount;

    expect(postStoreUsdcAtaBal).toBe(0n);
  });
});
