import { NextRequest, NextResponse } from "next/server";

import { fetchAllOrders, fetchOrder, fetchMultipleOrders } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const pdas = searchParams.getAll("pda");
  const shopper = searchParams.get("shopper");
  const store = searchParams.get("store");

  try {
    if (pdas.length === 0) {
      return NextResponse.json(
        {
          orders: await fetchAllOrders(CONNECTION, {
            shopper: shopper ?? undefined,
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
          orders: await fetchMultipleOrders(CONNECTION, pdas),
        },
        {
          status: 200,
        },
      );
    } else {
      return NextResponse.json(
        {
          order: await fetchOrder(CONNECTION, pdas[0]),
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
        error: err instanceof Error ? err.message : "Unable to fetch order account(s).",
      },
      {
        status: 500,
      },
    );
  }
}
