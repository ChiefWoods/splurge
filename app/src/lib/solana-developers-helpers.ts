// copied from @solana-developers/helpers to avoid issues with running Nodejs code on client-side

import {
  AddressLookupTableAccount,
  Cluster,
  Commitment,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

// https://github.com/solana-developers/helpers/blob/main/src/lib/explorer.ts#L20
const encodeURL = (baseUrl: string, searchParams: Record<string, string>) => {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
};

// https://github.com/solana-developers/helpers/blob/main/src/lib/explorer.ts#L30
export const getExplorerLink = (
  linkType: 'transaction' | 'tx' | 'address' | 'block',
  id: string,
  cluster: Cluster | 'localnet' = 'mainnet-beta'
): string => {
  const searchParams: Record<string, string> = {};
  if (cluster !== 'mainnet-beta') {
    if (cluster === 'localnet') {
      // localnet technically isn't a cluster, so requires special handling
      searchParams['cluster'] = 'custom';
      searchParams['customUrl'] = 'http://localhost:8899';
    } else {
      searchParams['cluster'] = cluster;
    }
  }
  let baseUrl: string = '';
  if (linkType === 'address') {
    baseUrl = `https://explorer.solana.com/address/${id}`;
  }
  if (linkType === 'transaction' || linkType === 'tx') {
    baseUrl = `https://explorer.solana.com/tx/${id}`;
  }
  if (linkType === 'block') {
    baseUrl = `https://explorer.solana.com/block/${id}`;
  }
  return encodeURL(baseUrl, searchParams);
};

// https://github.com/solana-developers/helpers/blob/a7e75d04cd4a83e6276a12526e839b2bf1d7b774/src/lib/transaction.ts#L40C1-L44C2
function isSetComputeLimitInstruction(ix: TransactionInstruction): boolean {
  return (
    ix.programId.equals(ComputeBudgetProgram.programId) && ix.data[0] === 2 // opcode for setComputeUnitLimit is 2
  );
}

// https://github.com/solana-developers/helpers/blob/a7e75d04cd4a83e6276a12526e839b2bf1d7b774/src/lib/transaction.ts#L77
export const getSimulationComputeUnits = async (
  connection: Connection,
  instructions: Array<TransactionInstruction>,
  payer: PublicKey,
  lookupTables: Array<AddressLookupTableAccount> | [],
  commitment: Commitment = 'confirmed'
): Promise<number | null> => {
  const simulationInstructions = [...instructions];

  // Replace or add compute limit instruction
  const computeLimitIndex = simulationInstructions.findIndex(
    isSetComputeLimitInstruction
  );
  const simulationLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 1_400_000,
  });

  if (computeLimitIndex >= 0) {
    simulationInstructions[computeLimitIndex] = simulationLimitIx;
  } else {
    simulationInstructions.unshift(simulationLimitIx);
  }

  const testTransaction = new VersionedTransaction(
    new TransactionMessage({
      instructions: simulationInstructions,
      payerKey: payer,
      // RecentBlockhash can by any public key during simulation
      // since 'replaceRecentBlockhash' is set to 'true' below
      recentBlockhash: PublicKey.default.toString(),
    }).compileToV0Message(lookupTables)
  );

  const rpcResponse = await connection.simulateTransaction(testTransaction, {
    replaceRecentBlockhash: true,
    sigVerify: false,
    commitment,
  });

  if (rpcResponse?.value?.err) {
    const logs = rpcResponse.value.logs?.join('\n  • ') || 'No logs available';
    throw new Error(
      `Transaction simulation failed:\n  •${logs}` +
        JSON.stringify(rpcResponse?.value?.err)
    );
  }

  return rpcResponse.value.unitsConsumed || null;
};
