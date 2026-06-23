import { NextRequest, NextResponse } from "next/server";

import { fetchAllItems, fetchItem, fetchMultipleItems } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll("pda");
  const store = searchParams.get("store");

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          items: await fetchAllItems(CONNECTION, {
            store: store ?? undefined,
          }),
        },
        {
          status: 200,
        },
      );
    } else if (pdas.length > 1) {
      return NextResponse.json(
        {
          items: await fetchMultipleItems(CONNECTION, pdas),
        },
        {
          status: 200,
        },
      );
    } else {
      return NextResponse.json(
        {
          item: await fetchItem(CONNECTION, pdas[0]),
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
        error: err instanceof Error ? err.message : "Unable to fetch item account(s).",
      },
      {
        status: 500,
      },
    );
  }
}
