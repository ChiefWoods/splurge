import { GetProgramAccountsFilter } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllItems,
  fetchAllOrders,
  fetchMultipleOrders,
  fetchOrder,
} from '@/lib/accounts';
import { DISCRIMINATOR_SIZE } from '@/lib/constants';

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
            offset: DISCRIMINATOR_SIZE,
            bytes: shopperPda,
            encoding: 'base58',
          },
        });
      }

      let orders = await fetchAllOrders(filters);

      // filter for orders with a matching item PDA
      if (storePda) {
        const itemAccs = await fetchAllItems([
          {
            memcmp: {
              offset: DISCRIMINATOR_SIZE,
              bytes: storePda,
              encoding: 'base58',
            },
          },
        ]);

        const itemPdas = itemAccs.map((item) => item.publicKey);

        orders = orders.filter(({ item }) => itemPdas.includes(item));
      }

      return NextResponse.json(
        {
          orders,
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          orders: await fetchMultipleOrders(pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          order: await fetchOrder(pdas[0]),
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
