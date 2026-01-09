import { NextRequest, NextResponse } from 'next/server';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import {
  fetchAllOrders,
  fetchOrder,
  fetchMultipleOrders,
} from '@/lib/accounts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const shopper = searchParams.get('shopper');
  const store = searchParams.get('store');

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          orders: await fetchAllOrders(SPLURGE_CLIENT, {
            shopper: shopper ?? undefined,
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
          orders: await fetchMultipleOrders(SPLURGE_CLIENT, pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          order: await fetchOrder(SPLURGE_CLIENT, pdas[0]),
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
            : 'Unable to fetch order account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
