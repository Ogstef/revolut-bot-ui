import { createContext, useContext, useState } from 'react';

interface PairContextType {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
}

const PairContext = createContext<PairContextType>({
  selectedPair: 'BTC-EUR',
  setSelectedPair: () => {},
});

export function PairProvider({ children }: { children: React.ReactNode }) {
  const [selectedPair, setSelectedPair] = useState('BTC-EUR');
  return (
    <PairContext.Provider value={{ selectedPair, setSelectedPair }}>
      {children}
    </PairContext.Provider>
  );
}

export function usePair() {
  return useContext(PairContext);
}
