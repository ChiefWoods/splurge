import { NextRequest, NextResponse } from 'next/server';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import {
  fetchAllStores,
  fetchStore,
  fetchMultipleStores,
} from '@/lib/accounts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const authority = searchParams.get('authority');

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          stores: await fetchAllStores(SPLURGE_CLIENT, {
            authority: authority ?? undefined,
          }),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          stores: await fetchMultipleStores(SPLURGE_CLIENT, pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          store: await fetchStore(SPLURGE_CLIENT, pdas[0]),
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
