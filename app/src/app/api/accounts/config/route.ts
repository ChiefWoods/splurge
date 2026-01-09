import { fetchConfig } from '@/lib/accounts';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        config: await fetchConfig(SPLURGE_CLIENT),
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to fetch config account.',
      },
      {
        status: 500,
      }
    );
  }
}
