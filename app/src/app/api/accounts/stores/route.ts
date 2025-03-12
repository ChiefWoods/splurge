import { parseProgramAccount, parseStore } from '@/lib/accounts';
import { SPLURGE_PROGRAM } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      const allStoreAcc = await SPLURGE_PROGRAM.account.store.all();

      return NextResponse.json(
        {
          stores: allStoreAcc.map((store) =>
            parseProgramAccount(store, parseStore)
          ),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      const storeAccs = await SPLURGE_PROGRAM.account.store.fetchMultiple(pdas);

      return NextResponse.json(
        {
          stores: storeAccs.map((store, i) =>
            store ? { publicKey: pdas[i], ...parseStore(store) } : null
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      const storeAcc = await SPLURGE_PROGRAM.account.store.fetchNullable(
        pdas[0]
      );

      return NextResponse.json(
        {
          store: storeAcc
            ? { publicKey: pdas[0], ...parseStore(storeAcc) }
            : null,
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
