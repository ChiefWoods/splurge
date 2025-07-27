import { NextRequest, NextResponse } from 'next/server';
import { fetchConfig } from '@/lib/accounts';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json(
      {
        config: await fetchConfig(),
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Unable to fetch config account.',
      },
      {
        status: 500,
      }
    );
  }
}
