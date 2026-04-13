import { createContext, useContext, useState } from 'react';

interface PairContextType {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
}

const PairContext = createContext<PairContextType>({
  selectedPair: 'BTC-EUR',
  setSelectedPair: () => {},
  selectedInterval: '15m',
  setSelectedInterval: () => {},
});

export function PairProvider({ children }: { children: React.ReactNode }) {
  const [selectedPair, setSelectedPair] = useState('BTC-EUR');
  const [selectedInterval, setSelectedInterval] = useState('15m');
  return (
    <PairContext.Provider value={{ selectedPair, setSelectedPair, selectedInterval, setSelectedInterval }}>
      {children}
    </PairContext.Provider>
  );
}

export function usePair() {
  return useContext(PairContext);
}
