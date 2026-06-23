import { NextResponse } from "next/server";

import { fetchConfig } from "@/lib/accounts";
import { CONNECTION } from "@/lib/server/solana";

export async function GET() {
  try {
    return NextResponse.json(
      {
        config: await fetchConfig(CONNECTION),
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unable to fetch config account.",
      },
      {
        status: 500,
      },
    );
  }
}
