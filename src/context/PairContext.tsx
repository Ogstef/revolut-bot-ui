import { createContext, useContext, useState } from 'react';
import type { TradingVehicle } from '../api/client';

interface PairContextType {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
  selectedVehicle: TradingVehicle;
  setSelectedVehicle: (vehicle: TradingVehicle) => void;
}

const PairContext = createContext<PairContextType>({
  selectedPair: 'BTC-EUR',
  setSelectedPair: () => {},
  selectedInterval: '15m',
  setSelectedInterval: () => {},
  selectedVehicle: 'SPOT',
  setSelectedVehicle: () => {},
});

export function PairProvider({ children }: { children: React.ReactNode }) {
  const [selectedPair, setSelectedPair] = useState('BTC-EUR');
  const [selectedInterval, setSelectedInterval] = useState('15m');
  const [selectedVehicle, setSelectedVehicle] = useState<TradingVehicle>('SPOT');
  return (
    <PairContext.Provider value={{
      selectedPair, setSelectedPair,
      selectedInterval, setSelectedInterval,
      selectedVehicle, setSelectedVehicle,
    }}>
      {children}
    </PairContext.Provider>
  );
}

export function usePair() {
  return useContext(PairContext);
}
