'use client';

import { ParsedConfig } from '@/types/accounts';
import { wrappedFetch } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWR from 'swr';

interface ConfigContextType {
  config: ParsedConfig | undefined;
  configLoading: boolean;
  configError: Error | undefined;
}

const ConfigContext = createContext<ConfigContextType>({} as ConfigContextType);

const apiEndpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/config`;

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const {
    data: config,
    isLoading: configLoading,
    error: configError,
  } = useSWR(apiEndpoint, async (url) => {
    return (await wrappedFetch(url)).config as ParsedConfig;
  });

  return (
    <ConfigContext.Provider
      value={{
        config,
        configLoading: configLoading,
        configError,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
