import { parseProgramAccount, parseOrder } from '@/lib/accounts';
import { SPLURGE_PROGRAM } from '@/lib/constants';
import { GetProgramAccountsFilter } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const shopperPda = searchParams.get('shopper');
  const storePda = searchParams.get('store');

  try {
    if (!pdas.length) {
      const filters: GetProgramAccountsFilter[] = [];

      if (shopperPda) {
        filters.push({
          memcmp: {
            offset: 1,
            bytes: shopperPda,
            encoding: 'base58',
          },
        });
      }

      if (storePda) {
        const itemAccs = await SPLURGE_PROGRAM.account.item.all([
          {
            memcmp: {
              offset: 1,
              bytes: storePda,
              encoding: 'base58',
            },
          },
        ]);

        const itemPdas = itemAccs.map((item) => item.publicKey.toBase58());

        filters.push(
          ...(itemPdas.map((itemPda) => {
            return {
              memcmp: {
                offset: 33,
                bytes: itemPda,
                encoding: 'base58',
              },
            };
          }) as GetProgramAccountsFilter[])
        );
      }

      const allOrderAcc = await SPLURGE_PROGRAM.account.order.all(filters);

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
