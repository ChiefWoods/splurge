import { clusterApiUrl, Connection, TransactionMessage } from '@solana/web3.js';
import { Cluster } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';
import { randomUUID } from 'crypto';
import { SplurgeClient } from '../splurge-client';
import { VersionedTransaction } from '@solana/web3.js';
import { DISCRIMINATOR_SIZE } from '../constants';

type BuildGatewayTransactionResponse = {
  result: {
    transaction: string;
    latestBlockhash: {
      blockhash: string;
      lastValidBlockHeight: string;
    };
  };
};

export type SendTransactionResponse = {
  result?: string;
  error?: {
    code: number;
    message: string;
  };
};

export type CuPriceRange = 'low' | 'medium' | 'high';
export type JitoTipRange = 'low' | 'medium' | 'high' | 'max';

const CLUSTER: Cluster = (process.env.SOLANA_RPC_CLUSTER ??
  'devnet') as Cluster;
export const CONNECTION = new Connection(
  process.env.SOLANA_RPC_URL ?? clusterApiUrl(CLUSTER),
  'confirmed'
);
export const SPLURGE_CLIENT = new SplurgeClient(CONNECTION);

export const ADMIN_KEYPAIR = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(process.env.ADMIN_KEYPAIR as string))
);

export async function validateProgramIx(
  tx: VersionedTransaction,
  allowedIxs: string[]
): Promise<boolean> {
  const { instructions } = TransactionMessage.decompile(tx.message);

  const ix = instructions.find((ix) =>
    ix.programId.equals(SPLURGE_CLIENT.getProgramId())
  );

  if (!ix) {
    return false;
  }

  return allowedIxs.some(async (ixName) => {
    const discriminator = ix.data.subarray(0, DISCRIMINATOR_SIZE);
    const hash = await crypto.subtle.digest(
      'SHA-256',
      Buffer.from(`global:${ixName}`)
    );
    const expected = Buffer.from(hash).subarray(0, DISCRIMINATOR_SIZE);

    return discriminator.equals(expected);
  });
}

export async function buildTx(
  transaction: string,
  cuPriceRange: CuPriceRange = 'low',
  jitoTipRange: JitoTipRange = 'low'
): Promise<string> {
  const res = await fetch(
    `${process.env.GATEWAY_URL}${process.env.GATEWAY_API}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: randomUUID(),
        jsonrpc: '2.0',
        method: 'buildGatewayTransaction',
        params: [
          transaction,
          {
            encoding: 'base64',
            skipSimulation: false,
            skipPriorityFee: false,
            cuPriceRange,
            jitoTipRange,
            deliveryMethodType: 'rpc',
          },
        ],
      }),
    }
  );

  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to build transaction.');
  }

  return (data as BuildGatewayTransactionResponse).result.transaction;
}

export async function sendTx(
  transaction: string
): Promise<SendTransactionResponse> {
  const res = await fetch(
    `${process.env.GATEWAY_URL}${process.env.GATEWAY_API}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: randomUUID(),
        jsonrpc: '2.0',
        method: 'sendTransaction',
        params: [
          transaction,
          {
            encoding: 'base64',
          },
        ],
      }),
    }
  );

  const data = (await res.json()) as SendTransactionResponse;

  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to send transaction.');
  }

  return data;
}
