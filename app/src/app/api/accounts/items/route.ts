import { GetProgramAccountsFilter } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';
import { fetchAllItems, fetchItem, fetchMultipleItems } from '@/lib/accounts';
import { DISCRIMINATOR_SIZE } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const storePda = searchParams.get('store');

  try {
    if (!pdas.length) {
      const filters: GetProgramAccountsFilter[] = storePda
        ? [
            {
              memcmp: {
                offset: DISCRIMINATOR_SIZE,
                bytes: storePda,
              },
            },
          ]
        : [];

      return NextResponse.json(
        {
          items: await fetchAllItems(filters),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          items: await fetchMultipleItems(pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          item: await fetchItem(pdas[0]),
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
