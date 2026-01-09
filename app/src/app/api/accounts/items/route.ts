import { NextRequest, NextResponse } from 'next/server';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { fetchAllItems, fetchItem, fetchMultipleItems } from '@/lib/accounts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const store = searchParams.get('store');

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          items: await fetchAllItems(SPLURGE_CLIENT, {
            store: store ?? undefined,
          }),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          items: await fetchMultipleItems(SPLURGE_CLIENT, pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          item: await fetchItem(SPLURGE_CLIENT, pdas[0]),
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
            : 'Unable to fetch item account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
