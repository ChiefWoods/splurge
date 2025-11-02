'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

type Explorer = 'solana-explorer' | 'solscan' | 'solanaFM' | 'orb';
export type PriorityFee = 'low' | 'median' | 'high';
type RpcType = 'default' | 'custom';

interface SettingsContextType {
  explorer: Explorer;
  setExplorer: (explorer: Explorer) => void;
  priorityFee: PriorityFee;
  setPriorityFee: (fee: PriorityFee) => void;
  rpcType: RpcType;
  setRpcType: (type: RpcType) => void;
  customRpcUrl: string;
  setCustomRpcUrl: (url: string) => void;
}

const SettingsContext = createContext<SettingsContextType>(
  {} as SettingsContextType
);

export function useSettings() {
  return useContext(SettingsContext);
}

const defaultSettings = {
  explorer: 'solana-explorer' as Explorer,
  priorityFee: 'low' as PriorityFee,
  rpcType: 'default' as RpcType,
  customRpcUrl: '',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [explorer, setExplorer] = useState<Explorer>(() => {
    if (typeof window === 'undefined') return defaultSettings.explorer;
    const saved = localStorage.getItem('explorer') as Explorer;
    return saved || defaultSettings.explorer;
  });

  const [priorityFee, setPriorityFee] = useState<PriorityFee>(() => {
    if (typeof window === 'undefined') return defaultSettings.priorityFee;
    const saved = localStorage.getItem('priority-fee') as PriorityFee;
    return saved || defaultSettings.priorityFee;
  });

  const [rpcType, setRpcType] = useState<RpcType>(() => {
    if (typeof window === 'undefined') return defaultSettings.rpcType;
    const saved = localStorage.getItem('rpc-type') as RpcType;
    return saved || defaultSettings.rpcType;
  });

  const [customRpcUrl, setCustomRpcUrl] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultSettings.customRpcUrl;
    const saved = localStorage.getItem('custom-rpc-url');
    return saved || defaultSettings.customRpcUrl;
  });

  useEffect(() => {
    localStorage.setItem('explorer', explorer);
  }, [explorer]);

  useEffect(() => {
    localStorage.setItem('priority-fee', priorityFee);
  }, [priorityFee]);

  useEffect(() => {
    localStorage.setItem('rpc-type', rpcType);
  }, [rpcType]);

  useEffect(() => {
    localStorage.setItem('custom-rpc-url', customRpcUrl);
  }, [customRpcUrl]);

  return (
    <SettingsContext.Provider
      value={{
        explorer,
        setExplorer,
        priorityFee,
        setPriorityFee,
        rpcType,
        setRpcType,
        customRpcUrl,
        setCustomRpcUrl,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
