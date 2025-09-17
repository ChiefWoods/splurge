import { DISCRIMINATOR_SIZE } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllOrders,
  fetchAllReviews,
  fetchMultipleReviews,
  fetchReview,
} from '@/lib/accounts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const itemPda = searchParams.get('item');

  try {
    if (!pdas.length) {
      let reviews = await fetchAllReviews();

      // filter for reviews with a matching order PDA
      if (itemPda) {
        const orderAccs = await fetchAllOrders([
          {
            memcmp: {
              offset: DISCRIMINATOR_SIZE + 32,
              bytes: itemPda,
            },
          },
        ]);

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
          reviews: await fetchMultipleReviews(pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          review: await fetchReview(pdas[0]),
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
