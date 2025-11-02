import { GetProgramAccountsFilter } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';
import { DISCRIMINATOR_SIZE } from '@/lib/constants';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { parseItem, parseOrder } from '@/types/accounts';

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
          },
        });
      }

      let orders = await SPLURGE_CLIENT.fetchAllProgramAccounts(
        'order',
        parseOrder,
        filters
      );

      // filter for orders with a matching item PDA
      if (storePda) {
        const itemAccs = await SPLURGE_CLIENT.fetchAllProgramAccounts(
          'item',
          parseItem,
          [
            {
              memcmp: {
                offset: DISCRIMINATOR_SIZE,
                bytes: storePda,
              },
            },
          ]
        );

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
          orders: await SPLURGE_CLIENT.fetchMultipleProgramAccounts(
            pdas,
            'order',
            parseOrder
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          order: await SPLURGE_CLIENT.fetchProgramAccount(
            pdas[0],
            'order',
            parseOrder
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
            : 'Unable to fetch order account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
