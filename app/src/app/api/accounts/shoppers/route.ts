import { NextRequest, NextResponse } from "next/server";

import { fetchAllShoppers, fetchShopper, fetchMultipleShoppers } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll("pda");
  const authority = searchParams.get("authority");

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          shoppers: await fetchAllShoppers(CONNECTION, {
            authority: authority ?? undefined,
          }),
        },
        {
          status: 200,
        },
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          shoppers: await fetchMultipleShoppers(CONNECTION, pdas),
        },
        {
          status: 200,
        },
      );
    } else {
      return NextResponse.json(
        {
          shopper: await fetchShopper(CONNECTION, pdas[0]),
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
        error: err instanceof Error ? err.message : "Unable to fetch shopper account(s).",
      },
      {
        status: 500,
      },
    );
  }
}
