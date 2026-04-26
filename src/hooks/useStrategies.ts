import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchStrategies, fetchTrades, fetchStats, fetchPositions } from '../api/strategies';
import { fetchSignalSummary } from '../api/signals';
import type { StrategyName } from '../api/client';

export function useStrategies(pair: string, interval?: string) {
  return useQuery({
    queryKey: ['strategies', pair, interval],
    queryFn: () => fetchStrategies(pair, interval),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

export function useAllStrategyTrades(pair: string, strategyNames: string[], interval?: string) {
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['trades', name, pair, interval],
      queryFn: () => fetchTrades(name as StrategyName, pair, 500, interval),
      refetchInterval: 30_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useAllStrategyStats(pair: string, strategyNames: string[], interval?: string) {
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['stats', name, pair, interval],
      queryFn: () => fetchStats(name as StrategyName, pair, interval),
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useAllStrategyPositions(pair: string, strategyNames: string[], interval?: string) {
  const results = useQueries({
    queries: strategyNames.map(name => ({
      queryKey: ['positions', name, pair, interval],
      queryFn: () => fetchPositions(name as StrategyName, pair, interval),
      refetchInterval: 15_000,
      refetchIntervalInBackground: false,
      retry: false,
    })),
  });
  return results.map((result, i) => ({ name: strategyNames[i], query: result }));
}

export function useSignalSummary(pair: string, interval?: string) {
  return useQuery({
    queryKey: ['signals-summary', pair, interval],
    queryFn: () => fetchSignalSummary(pair, interval),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: false,
  });
}
