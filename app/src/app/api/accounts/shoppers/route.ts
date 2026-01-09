import { NextRequest, NextResponse } from 'next/server';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import {
  fetchAllShoppers,
  fetchShopper,
  fetchMultipleShoppers,
} from '@/lib/accounts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          shoppers: await fetchAllShoppers(SPLURGE_CLIENT),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          shoppers: await fetchMultipleShoppers(SPLURGE_CLIENT, pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          shopper: await fetchShopper(SPLURGE_CLIENT, pdas[0]),
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
            : 'Unable to fetch shopper account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
