import { DISCRIMINATOR_SIZE } from '@/lib/constants';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import { parseOrder, parseReview } from '@/types/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const itemPda = searchParams.get('item');

  try {
    if (!pdas.length) {
      let reviews = await SPLURGE_CLIENT.fetchAllProgramAccounts(
        'review',
        parseReview
      );

      // filter for reviews with a matching order PDA
      if (itemPda) {
        const orderAccs = await SPLURGE_CLIENT.fetchAllProgramAccounts(
          'order',
          parseOrder,
          [
            {
              memcmp: {
                offset: DISCRIMINATOR_SIZE + 32,
                bytes: itemPda,
              },
            },
          ]
        );

        const orderPdas = orderAccs.map(({ publicKey }) => publicKey);

        reviews = reviews.filter(({ order }) => orderPdas.includes(order));
      }

      return NextResponse.json(
        {
          reviews,
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          reviews: await SPLURGE_CLIENT.fetchMultipleProgramAccounts(
            pdas,
            'review',
            parseReview
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          review: await SPLURGE_CLIENT.fetchProgramAccount(
            pdas[0],
            'review',
            parseReview
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
            : 'Unable to fetch review account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
