import { GetProgramAccountsFilter } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';
import { DISCRIMINATOR_SIZE } from '@/lib/constants';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { parseItem } from '@/types/accounts';

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
          items: await SPLURGE_CLIENT.fetchAllProgramAccounts(
            'item',
            parseItem,
            filters
          ),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          items: await SPLURGE_CLIENT.fetchMultipleProgramAccounts(
            pdas,
            'item',
            parseItem
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          item: await SPLURGE_CLIENT.fetchProgramAccount(
            pdas[0],
            'item',
            parseItem
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
            : 'Unable to fetch item account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
