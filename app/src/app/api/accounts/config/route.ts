import {
  parseProgramAccount,
  parseConfig,
  SPLURGE_PROGRAM,
} from '@/lib/accounts';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const [configAcc] = await SPLURGE_PROGRAM.account.config.all();

    return NextResponse.json(
      {
        config: parseProgramAccount(configAcc, parseConfig),
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
