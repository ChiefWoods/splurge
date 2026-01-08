import { SplurgeClient } from '@/classes/SplurgeClient';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { parseConfig } from '@/types/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        config: await SPLURGE_CLIENT.fetchProgramAccount(
          SplurgeClient.getConfigPda(),
          'config',
          parseConfig
        ),
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
