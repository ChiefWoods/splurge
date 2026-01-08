import { SplurgeClient } from '@/classes/SplurgeClient';
import { TuktukClient } from '@/classes/TuktukClient';
import { useConnection } from '@solana/wallet-adapter-react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

interface ProgramContextType {
  splurgeClient: SplurgeClient;
  tuktukClient: TuktukClient;
}

const ProgramContext = createContext<ProgramContextType>(
  {} as ProgramContextType
);

export function useProgram() {
  return useContext(ProgramContext);
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();

  const splurgeClient = useMemo(
    () => new SplurgeClient(connection),
    [connection]
  );
  const tuktukClient = useMemo(
    () => new TuktukClient(connection),
    [connection]
  );

  return (
    <ProgramContext.Provider
      value={{
        splurgeClient,
        tuktukClient,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}
