import {
  fetchAllShoppers,
  fetchMultipleShoppers,
  fetchShopper,
} from '@/lib/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      return NextResponse.json(
        {
          shoppers: await fetchAllShoppers(),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          shoppers: await fetchMultipleShoppers(pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          shopper: await fetchShopper(pdas[0]),
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
            : 'Unable to fetch shoppper account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
