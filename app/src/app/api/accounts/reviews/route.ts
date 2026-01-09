import { NextRequest, NextResponse } from 'next/server';
import { SPLURGE_CLIENT } from '@/lib/server/solana';
import {
  fetchAllReviews,
  fetchReview,
  fetchMultipleReviews,
} from '@/lib/accounts';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');
  const item = searchParams.get('item');

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          reviews: await fetchAllReviews(SPLURGE_CLIENT, {
            item: item ?? undefined,
          }),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          reviews: await fetchMultipleReviews(SPLURGE_CLIENT, pdas),
        },
        {
          status: 200,
        }
      );
    } else {
      return NextResponse.json(
        {
          review: await fetchReview(SPLURGE_CLIENT, pdas[0]),
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
