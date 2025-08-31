'use client';

import { ParsedConfig } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface ConfigContextType {
  configData: ParsedConfig | undefined;
  configIsLoading: boolean;
  configMutate: KeyedMutator<ParsedConfig>;
}

const ConfigContext = createContext<ConfigContextType>({} as ConfigContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/config`;

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const {
    data: configData,
    isLoading: configIsLoading,
    mutate: configMutate,
  } = useSWR(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).config as ParsedConfig;
  });

  return (
    <ConfigContext.Provider
      value={{
        configData,
        configIsLoading,
        configMutate,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
