export type BuildGatewayTransactionResponse = {
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

export type CuPriceRange = 'low' | 'median' | 'high';
export type JitoTipRange = 'low' | 'median' | 'high' | 'max';
