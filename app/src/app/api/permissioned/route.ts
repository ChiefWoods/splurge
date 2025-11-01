import { VersionedTransaction } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_KEYPAIR, CONNECTION } from '@/lib/server/solana';
import { confirmTransaction } from '@solana-developers/helpers';
import { validateProgramIx } from '@/lib/utils';

const allowedIxs = ['ship_order', 'cancel_order'];

export async function POST(req: NextRequest) {
  try {
    const { transaction } = await req.json();

    if (!transaction) {
      return NextResponse.json(
        { error: 'Serialized transaction is required.' },
        { status: 400 }
      );
    }

    const tx = VersionedTransaction.deserialize(
      Buffer.from(transaction, 'base64')
    );

    if (!validateProgramIx(tx, allowedIxs)) {
      return NextResponse.json(
        { error: 'Transaction does not contain the correct instruction.' },
        { status: 400 }
      );
    }

    tx.sign([ADMIN_KEYPAIR]);

    const signature = await CONNECTION.sendTransaction(tx);

    await confirmTransaction(CONNECTION, signature);

    return NextResponse.json({ signature });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Failed to send permissioned transaction.',
      },
      { status: 500 }
    );
  }
}
