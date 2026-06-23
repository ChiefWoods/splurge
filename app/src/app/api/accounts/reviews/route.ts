import { NextRequest, NextResponse } from "next/server";

import { fetchAllReviews, fetchReview, fetchMultipleReviews } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll("pda");
  const item = searchParams.get("item");

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          reviews: await fetchAllReviews(CONNECTION, {
            item: item ?? undefined,
          }),
        },
        {
          status: 200,
        },
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          reviews: await fetchMultipleReviews(CONNECTION, pdas),
        },
        {
          status: 200,
        },
      );
    } else {
      return NextResponse.json(
        {
          review: await fetchReview(CONNECTION, pdas[0]),
        },
        {
          status: 200,
        },
      );
    }
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unable to fetch review account(s).",
      },
      {
        status: 500,
      },
    );
  }
}
