import { useQuery } from '@tanstack/react-query';
import { fetchPositions, fetchTrades, fetchStats, fetchPnl } from '../api/strategies';
import { fetchStrategySignals } from '../api/signals';
import { usePair } from '../context/PairContext';
import type { StrategyName } from '../api/client';

export function useStrategyDetail(name: StrategyName, pair: string, interval?: string) {
  const { selectedVehicle } = usePair();

  const positions = useQuery({
    queryKey: ['positions', name, pair, interval, selectedVehicle],
    queryFn: () => fetchPositions(name, pair, interval, selectedVehicle),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const trades = useQuery({
    queryKey: ['trades', name, pair, interval, selectedVehicle],
    queryFn: () => fetchTrades(name, pair, 50, interval, selectedVehicle),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const stats = useQuery({
    queryKey: ['stats', name, pair, interval, selectedVehicle],
    queryFn: () => fetchStats(name, pair, interval, selectedVehicle),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const pnl = useQuery({
    queryKey: ['pnl', name, pair, interval, selectedVehicle],
    queryFn: () => fetchPnl(name, pair, interval, selectedVehicle),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const signals = useQuery({
    queryKey: ['signals', name, pair, interval],
    queryFn: () => fetchStrategySignals(name, pair, 20, interval),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  return { positions, trades, stats, pnl, signals };
}
