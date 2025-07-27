import {
  fetchAllStores,
  fetchMultipleStores,
  fetchStore,
} from '@/lib/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      return NextResponse.json(
        {
          stores: await fetchAllStores(),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          stores: await fetchMultipleStores(pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          store: await fetchStore(pdas[0]),
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
