import { parseProgramAccount, parseShopper } from '@/lib/accounts';
import { SPLURGE_PROGRAM } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      const allShopperAcc = await SPLURGE_PROGRAM.account.shopper.all();

      return NextResponse.json(
        {
          shoppers: allShopperAcc.map((shopper) =>
            parseProgramAccount(shopper, parseShopper)
          ),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      const shopperAccs =
        await SPLURGE_PROGRAM.account.shopper.fetchMultiple(pdas);

      return NextResponse.json(
        {
          shoppers: shopperAccs.map((shopper, i) =>
            shopper ? { publicKey: pdas[i], ...parseShopper(shopper) } : null
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      const shopperAcc = await SPLURGE_PROGRAM.account.shopper.fetchNullable(
        pdas[0]
      );

      return NextResponse.json(
        {
          shopper: shopperAcc
            ? { publicKey: pdas[0], ...parseShopper(shopperAcc) }
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
            : 'Unable to fetch shoppper account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
