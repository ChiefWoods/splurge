import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { parseStore } from '@/types/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      return NextResponse.json(
        {
          stores: await SPLURGE_CLIENT.fetchAllProgramAccounts(
            'store',
            parseStore
          ),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          stores: await SPLURGE_CLIENT.fetchMultipleProgramAccounts(
            pdas,
            'store',
            parseStore
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          store: await SPLURGE_CLIENT.fetchProgramAccount(
            pdas[0],
            'store',
            parseStore
          ),
        },
        {
          status: 200,
        }
      );
    }
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to fetch store account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
