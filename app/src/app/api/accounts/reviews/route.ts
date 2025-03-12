import {
  parseProgramAccount,
  parseReview,
  SPLURGE_PROGRAM,
} from '@/lib/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll('pda');

  try {
    if (!pdas.length) {
      const allReviewAcc = await SPLURGE_PROGRAM.account.review.all();

      return NextResponse.json(
        {
          reviews: allReviewAcc.map((review) =>
            parseProgramAccount(review, parseReview)
          ),
        },
        {
          status: 200,
        }
      );
    } else if (pdas.length > 1) {
      const reviewAccs =
        await SPLURGE_PROGRAM.account.review.fetchMultiple(pdas);

      return NextResponse.json(
        {
          reviews: reviewAccs.map((review, i) =>
            review ? { publicKey: pdas[i], ...parseReview(review) } : null
          ),
        },
        {
          status: 200,
        }
      );
    } else {
      const reviewAcc = await SPLURGE_PROGRAM.account.review.fetchNullable(
        pdas[0]
      );

      return NextResponse.json(
        {
          review: reviewAcc
            ? { publicKey: pdas[0], ...parseReview(reviewAcc) }
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
            : 'Unable to fetch review account(s).',
      },
      {
        status: 500,
      }
    );
  }
}
