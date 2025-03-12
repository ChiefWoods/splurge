import {
  parseProgramAccount,
  parseOrder,
  SPLURGE_PROGRAM,
} from '@/lib/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      const allOrderAcc = await SPLURGE_PROGRAM.account.order.all();

      return NextResponse.json(
        {
          orders: allOrderAcc.map((order) =>
            parseProgramAccount(order, parseOrder)
          ),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      const orderAccs = await SPLURGE_PROGRAM.account.order.fetchMultiple(pdas);

      return NextResponse.json(
        {
          orders: orderAccs.map((order, i) =>
            order ? { publicKey: pdas[i], ...parseOrder(order) } : null
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      const orderAcc = await SPLURGE_PROGRAM.account.order.fetchNullable(
        pdas[0]
      );

      return NextResponse.json(
        {
          order: orderAcc
            ? { publicKey: pdas[0], ...parseOrder(orderAcc) }
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
            : 'Unable to fetch order account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
