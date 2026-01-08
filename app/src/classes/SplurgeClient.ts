import { Splurge } from '@/types/splurge';
import { Address, BN, Program } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import splurgeIdl from '@/idl/splurge.json';
import { PublicKey } from '@solana/web3.js';
import {
  CreateReviewArgs,
  InitializeShopperArgs,
  InitializeStoreArgs,
  ListItemArgs,
  UpdateItemArgs,
} from '@/types/accounts';
import { TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  nextAvailableTaskIds,
  taskKey,
  taskQueueAuthorityKey,
} from '@helium/tuktuk-sdk';
import { ProgramClient } from './ProgramClient';
import { TASK_QUEUE } from '../lib/client/solana';
import { Tuktuk } from '@helium/tuktuk-idls/lib/types/tuktuk.js';

export class SplurgeClient extends ProgramClient<Splurge> {
  static PROGRAM_ID = new PublicKey(splurgeIdl.address);
  static MAX_SHOPPER_NAME_LENGTH = 64;
  static MAX_STORE_NAME_LENGTH = 64;
  static MAX_ITEM_NAME_LENGTH = 32;

  constructor(connection: Connection) {
    super(connection, splurgeIdl);
  }

  static configPda = this.getConfigPda();

  static getConfigPda(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.PROGRAM_ID
    )[0];
  }

  static getShopperPda(authority: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('shopper'), authority.toBuffer()],
      this.PROGRAM_ID
    )[0];
  }

  static getStorePda(authority: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('store'), authority.toBuffer()],
      this.PROGRAM_ID
    )[0];
  }

  static getItemPda(storePda: PublicKey, name: string): PublicKey {
    if (name.length > SplurgeClient.MAX_ITEM_NAME_LENGTH) {
      throw new Error('Store item name exceeds maximum seed length');
    }

    return PublicKey.findProgramAddressSync(
      [Buffer.from('item'), storePda.toBuffer(), Buffer.from(name)],
      this.PROGRAM_ID
    )[0];
  }

  static getOrderPda(
    shopperPda: PublicKey,
    itemPda: PublicKey,
    timestamp: BN
  ): PublicKey {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('order'),
        shopperPda.toBuffer(),
        itemPda.toBuffer(),
        timestamp.toArrayLike(Buffer, 'le', 8),
      ],
      this.PROGRAM_ID
    )[0];
  }

  static getReviewPda(orderPda: PublicKey): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('review'), orderPda.toBuffer()],
      this.PROGRAM_ID
    )[0];
  }

  async createShopperIx({
    name,
    image,
    address,
    authority,
  }: InitializeShopperArgs & {
    authority: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .initializeShopper({
        name,
        image,
        address,
      })
      .accounts({
        authority,
      })
      .instruction();
  }

  async createStoreIx({
    name,
    image,
    about,
    authority,
  }: InitializeStoreArgs & {
    authority: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .initializeStore({
        name,
        image,
        about,
      })
      .accounts({
        authority,
      })
      .instruction();
  }

  async listItemIx({
    price,
    inventoryCount,
    name,
    image,
    description,
    authority,
  }: ListItemArgs & {
    authority: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .listItem({
        price,
        inventoryCount,
        name,
        image,
        description,
      })
      .accounts({
        authority,
      })
      .instruction();
  }

  async updateItemIx({
    price,
    inventoryCount,
    authority,
    itemPda,
    storePda,
  }: UpdateItemArgs & {
    authority: Address;
    itemPda: Address;
    storePda: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .updateItem({
        price,
        inventoryCount,
      })
      .accountsPartial({
        authority,
        item: itemPda,
        store: storePda,
      })
      .instruction();
  }

  async unlistItemIx({
    authority,
    itemPda,
    storePda,
  }: {
    authority: Address;
    itemPda: Address;
    storePda: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .unlistItem()
      .accountsPartial({
        authority,
        item: itemPda,
        store: storePda,
      })
      .instruction();
  }

  async createOrderIx({
    amount,
    authority,
    storePda,
    itemPda,
    priceUpdateV2,
    paymentMint,
    tokenProgram,
  }: {
    amount: number;
    authority: Address;
    storePda: Address;
    itemPda: Address;
    priceUpdateV2: Address;
    paymentMint: Address;
    tokenProgram: Address;
  }): Promise<TransactionInstruction> {
    // timestamp is deducted by 1 second to provide an approximation buffer for clock drift
    const timestamp = Math.floor(Date.now() / 1000 - 1);

    return await this.program.methods
      .createOrder(amount, new BN(timestamp))
      .accountsPartial({
        authority,
        store: storePda,
        item: itemPda,
        priceUpdateV2,
        paymentMint,
        tokenProgram,
      })
      .instruction();
  }

  async shipOrderIx({
    admin,
    orderPda,
    authority,
    itemPda,
    paymentMint,
    shopperPda,
    storePda,
    tokenProgram,
    tuktukProgram,
  }: {
    admin: PublicKey;
    orderPda: PublicKey;
    authority: Address;
    itemPda: Address;
    paymentMint: PublicKey;
    shopperPda: Address;
    storePda: PublicKey;
    tokenProgram: PublicKey;
    tuktukProgram: Program<Tuktuk>;
  }): Promise<TransactionInstruction> {
    const orderAta = getAssociatedTokenAddressSync(
      paymentMint,
      orderPda,
      true,
      tokenProgram
    );
    const storeAta = getAssociatedTokenAddressSync(
      paymentMint,
      storePda,
      true,
      tokenProgram
    );
    const taskQueueAcc =
      await tuktukProgram.account.taskQueueV0.fetchNullable(TASK_QUEUE);
    if (!taskQueueAcc) throw new Error('Task queue not found.');
    const taskId = nextAvailableTaskIds(taskQueueAcc.taskBitmap, 1, false)[0];
    const [taskPda] = taskKey(TASK_QUEUE, taskId, tuktukProgram.programId);
    const [taskQueueAuthorityPda] = taskQueueAuthorityKey(TASK_QUEUE, admin);

    return await this.program.methods
      .shipOrder(taskId)
      .accountsPartial({
        admin,
        order: orderPda,
        authority,
        item: itemPda,
        orderTokenAccount: orderAta,
        paymentMint,
        shopper: shopperPda,
        store: storePda,
        storeTokenAccount: storeAta,
        task: taskPda,
        taskQueue: TASK_QUEUE,
        tokenProgram,
        tuktuk: tuktukProgram.programId,
        taskQueueAuthority: taskQueueAuthorityPda,
      })
      .instruction();
  }

  async cancelOrderIx({
    admin,
    orderPda,
    paymentMint,
    shopperPda,
    tokenProgram,
  }: {
    admin: Address;
    orderPda: Address;
    paymentMint: Address;
    shopperPda: Address;
    tokenProgram: Address;
  }) {
    return this.program.methods
      .cancelOrder()
      .accountsPartial({
        admin,
        order: orderPda,
        paymentMint,
        shopper: shopperPda,
        tokenProgram,
      })
      .instruction();
  }

  async createReviewIx({
    text,
    rating,
    authority,
    shopperPda,
    orderPda,
  }: CreateReviewArgs & {
    authority: Address;
    shopperPda: Address;
    orderPda: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .createReview({
        text,
        rating,
      })
      .accountsPartial({
        authority,
        shopper: shopperPda,
        order: orderPda,
      })
      .instruction();
  }

  async withdrawEarningsIx({
    authority,
    storePda,
    paymentMint,
    tokenProgram,
  }: {
    authority: Address;
    storePda: Address;
    paymentMint: Address;
    tokenProgram: Address;
  }): Promise<TransactionInstruction> {
    return await this.program.methods
      .withdrawEarnings()
      .accountsPartial({
        authority,
        store: storePda,
        paymentMint,
        tokenProgram,
      })
      .instruction();
  }
}
