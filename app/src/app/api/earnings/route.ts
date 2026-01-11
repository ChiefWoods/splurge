import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { getStoreEarnings } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const store = searchParams.get('store');

  if (!store) {
    return NextResponse.json(
      {
        error: 'Store is required.',
      },
      {
        status: 400,
      }
    );
  }

  try {
    const earnings = await getStoreEarnings(SPLURGE_CLIENT, store);

    return NextResponse.json({ earnings });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to fetch store earnings.',
      },
      {
        status: 500,
      }
    );
  }
}
