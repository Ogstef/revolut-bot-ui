import { useQuery } from '@tanstack/react-query';
import { fetchStrategies, fetchTrades, fetchStats } from '../api/strategies';
import { fetchSignalSummary } from '../api/signals';
import type { StrategyName } from '../api/client';
import { STRATEGIES } from '../api/client';

export function useStrategies(pair: string) {
  return useQuery({
    queryKey: ['strategies', pair],
    queryFn: () => fetchStrategies(pair),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

export function useAllStrategyTrades(pair: string) {
  return STRATEGIES.map(s => ({
    name: s.name,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useQuery({
      queryKey: ['trades', s.name, pair],
      queryFn: () => fetchTrades(s.name as StrategyName, pair, 500),
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      retry: false,
    }),
  }));
}

export function useAllStrategyStats(pair: string) {
  return STRATEGIES.map(s => ({
    name: s.name,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useQuery({
      queryKey: ['stats', s.name, pair],
      queryFn: () => fetchStats(s.name as StrategyName, pair),
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      retry: false,
    }),
  }));
}

export function useSignalSummary(pair: string) {
  return useQuery({
    queryKey: ['signals-summary', pair],
    queryFn: () => fetchSignalSummary(pair),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
