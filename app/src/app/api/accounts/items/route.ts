import {
  parseProgramAccount,
  parseItem,
  SPLURGE_PROGRAM,
} from '@/lib/accounts';
import { GetProgramAccountsFilter } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';

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
                offset: 1,
                bytes: storePda,
                encoding: 'base58',
              },
            },
          ]
        : [];

      const allItemAcc = await SPLURGE_PROGRAM.account.item.all(filters);

      return NextResponse.json(
        {
          items: allItemAcc.map((item) => parseProgramAccount(item, parseItem)),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      const itemAccs = await SPLURGE_PROGRAM.account.item.fetchMultiple(pdas);

      return NextResponse.json(
        {
          items: itemAccs.map((item, i) =>
            item ? { publicKey: pdas[i], ...parseItem(item) } : null
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      const itemAcc = await SPLURGE_PROGRAM.account.item.fetchNullable(pdas[0]);

      return NextResponse.json(
        {
          item: itemAcc ? { publicKey: pdas[0], ...parseItem(itemAcc) } : null,
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
