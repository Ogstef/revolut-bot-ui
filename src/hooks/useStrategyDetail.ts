import { useQuery } from '@tanstack/react-query';
import { fetchPositions, fetchTrades, fetchStats, fetchPnl } from '../api/strategies';
import { fetchStrategySignals } from '../api/signals';
import type { StrategyName } from '../api/client';

export function useStrategyDetail(name: StrategyName, pair: string) {
  const positions = useQuery({
    queryKey: ['positions', name, pair],
    queryFn: () => fetchPositions(name, pair),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const trades = useQuery({
    queryKey: ['trades', name, pair],
    queryFn: () => fetchTrades(name, pair, 50),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const stats = useQuery({
    queryKey: ['stats', name, pair],
    queryFn: () => fetchStats(name, pair),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const pnl = useQuery({
    queryKey: ['pnl', name, pair],
    queryFn: () => fetchPnl(name, pair),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  const signals = useQuery({
    queryKey: ['signals', name, pair],
    queryFn: () => fetchStrategySignals(name, pair, 20),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: false,
  });

  return { positions, trades, stats, pnl, signals };
}
