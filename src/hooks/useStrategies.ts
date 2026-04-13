import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchStrategies, fetchTrades, fetchStats, fetchPositions } from '../api/strategies';
import { fetchSignalSummary } from '../api/signals';
import type { StrategyName } from '../api/client';

export function useStrategies(pair: string) {
  return useQuery({
    queryKey: ['strategies', pair],
    queryFn: () => fetchStrategies(pair),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

export function useAllStrategyTrades(pair: string, strategyNames: string[]) {
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['trades', name, pair],
      queryFn: () => fetchTrades(name as StrategyName, pair, 500),
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useAllStrategyStats(pair: string, strategyNames: string[]) {
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['stats', name, pair],
      queryFn: () => fetchStats(name as StrategyName, pair),
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useAllStrategyPositions(pair: string, strategyNames: string[]) {
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['positions', name, pair],
      queryFn: () => fetchPositions(name as StrategyName, pair),
      refetchInterval: 15_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
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
