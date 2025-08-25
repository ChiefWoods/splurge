'use client';

import { ParsedConfig } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { SWRResponse } from 'swr';

interface ConfigContextType {
  config: SWRResponse<ParsedConfig, any, any>;
}

const ConfigContext = createContext<ConfigContextType>({} as ConfigContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/config`;

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const config = useSWR(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).config as ParsedConfig;
  });

  return (
    <ConfigContext.Provider
      value={{
        config,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
