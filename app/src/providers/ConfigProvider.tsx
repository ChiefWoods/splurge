'use client';

import { ParsedConfig } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR, { KeyedMutator } from 'swr';

interface ConfigContextType {
  configData: ParsedConfig | undefined;
  configLoading: boolean;
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
    isLoading: configLoading,
    mutate: configMutate,
  } = useSWR('config', async () => {
    const url = new URL(apiEndpoint);

    const config = (await wrappedFetch(url.href)).config as ParsedConfig;

    return config;
  });

  return (
    <ConfigContext.Provider
      value={{
        configData,
        configLoading,
        configMutate,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
