'use client';

import { ParsedConfig, ParsedProgramAccount } from '@/lib/accounts';
import { defaultFetcher } from '@/lib/api';
import { createContext, ReactNode, useContext } from 'react';
import useSWRMutation, { TriggerWithoutArgs } from 'swr/mutation';

interface ConfigContextType {
  config: ParsedProgramAccount<ParsedConfig> | undefined;
  configMutating: boolean;
  configError: Error | undefined;
  triggerConfig: TriggerWithoutArgs;
}

const ConfigContext = createContext<ConfigContextType>({} as ConfigContextType);

const url = '/api/accounts/config';

export function useConfig() {
  return useContext(ConfigContext);
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const {
    data: config,
    isMutating: configMutating,
    error: configError,
    trigger: triggerConfig,
  } = useSWRMutation(url, async (url) => {
    return (await defaultFetcher(url))
      .config as ParsedProgramAccount<ParsedConfig>;
  });

  return (
    <ConfigContext.Provider
      value={{
        config,
        configMutating,
        configError,
        triggerConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
