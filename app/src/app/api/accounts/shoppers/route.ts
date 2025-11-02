import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { parseShopper } from '@/types/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      return NextResponse.json(
        {
          shoppers: await SPLURGE_CLIENT.fetchAllProgramAccounts(
            'shopper',
            parseShopper
          ),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          shoppers: await SPLURGE_CLIENT.fetchMultipleProgramAccounts(
            pdas,
            'shopper',
            parseShopper
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          shopper: await SPLURGE_CLIENT.fetchProgramAccount(
            pdas[0],
            'shopper',
            parseShopper
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
            : 'Unable to fetch shoppper account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
